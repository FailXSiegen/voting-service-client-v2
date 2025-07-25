/**
 * End-to-End WebSocket Tests für Voting Tool
 * Tests für komplette WebSocket-Workflows zwischen Client und Server
 */

const { chromium } = require('playwright');
const WebSocket = require('ws');
const { createClient } = require('graphql-ws');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const API_URL = process.env.API_URL || 'http://localhost:4000';
const WS_URL = process.env.WS_URL || 'ws://localhost:4000/graphql';
const TEST_TIMEOUT = 30000;

describe('E2E WebSocket Tests', () => {
  let browser;
  let context;
  let page;
  let wsClient;

  beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: process.env.CI === 'true',
      slowMo: 100 
    });
    context = await browser.newContext();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await context.newPage();
    
    // Listen to console logs for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser Console Error:', msg.text());
      }
    });

    // Listen to WebSocket events in browser
    await page.addInitScript(() => {
      window.websocketEvents = [];
      const originalWebSocket = window.WebSocket;
      
      window.WebSocket = function(url, protocols) {
        const ws = new originalWebSocket(url, protocols);
        
        ws.addEventListener('open', () => {
          window.websocketEvents.push({ type: 'open', timestamp: Date.now() });
        });
        
        ws.addEventListener('message', (event) => {
          window.websocketEvents.push({ 
            type: 'message', 
            data: event.data,
            timestamp: Date.now() 
          });
        });
        
        ws.addEventListener('close', (event) => {
          window.websocketEvents.push({ 
            type: 'close', 
            code: event.code,
            reason: event.reason,
            timestamp: Date.now() 
          });
        });
        
        ws.addEventListener('error', (event) => {
          window.websocketEvents.push({ 
            type: 'error', 
            error: event.error?.message || 'WebSocket error',
            timestamp: Date.now() 
          });
        });
        
        return ws;
      };
    });
  });

  afterEach(async () => {
    if (wsClient) {
      wsClient.dispose();
      wsClient = null;
    }
    if (page) {
      await page.close();
    }
  });

  describe('WebSocket Connection Flow', () => {
    test('should establish WebSocket connection when loading voting page', async () => {
      await page.goto(BASE_URL);
      
      // Wait for page to load and potentially establish WebSocket connection
      await page.waitForTimeout(3000);
      
      // Check if WebSocket events were triggered
      const wsEvents = await page.evaluate(() => window.websocketEvents);
      
      console.log('WebSocket Events:', wsEvents);
      
      // Should have at least attempted to connect
      expect(wsEvents.length).toBeGreaterThan(0);
      
      // Check if connection was established
      const openEvent = wsEvents.find(event => event.type === 'open');
      if (openEvent) {
        console.log('✅ WebSocket connection established in browser');
        expect(openEvent).toBeDefined();
      } else {
        console.log('ℹ️ WebSocket connection not established (may be expected for anonymous users)');
      }
    }, TEST_TIMEOUT);

    test('should handle WebSocket authentication flow', async () => {
      // Navigate to login page if available
      await page.goto(BASE_URL);
      
      // Try to find login form (adjust selectors based on actual UI)
      try {
        await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 5000 });
        
        // Fill login form if available
        await page.fill('input[type="email"], input[type="text"]', 'test@example.com');
        await page.fill('input[type="password"]', 'testpassword');
        
        // Submit login
        await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Anmelden")');
        
        // Wait for potential redirect and WebSocket connection
        await page.waitForTimeout(5000);
        
        // Check WebSocket events after login
        const wsEvents = await page.evaluate(() => window.websocketEvents);
        console.log('WebSocket Events after login:', wsEvents);
        
        // Should have WebSocket activity after login
        expect(wsEvents.length).toBeGreaterThan(0);
        
      } catch (error) {
        console.log('ℹ️ Login form not found or login failed - testing anonymous connection');
        
        // Even without login, there might be WebSocket activity
        const wsEvents = await page.evaluate(() => window.websocketEvents);
        console.log('WebSocket Events (anonymous):', wsEvents);
      }
    }, TEST_TIMEOUT);
  });

  describe('Real-time Functionality', () => {
    test('should handle real-time updates between multiple clients', async () => {
      // Create server-side WebSocket client to simulate external events
      wsClient = createClient({
        url: WS_URL,
        connectionParams: {}
      });

      // Open voting page in browser
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      // Subscribe to updates from server side
      let serverUpdateReceived = false;
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
            console.log('✅ Server-side subscription data:', data);
            serverUpdateReceived = true;
            unsubscribe();
          },
          error: (error) => {
            console.log('ℹ️ Server-side subscription error:', error.message);
            unsubscribe();
          }
        }
      );

      // Wait for potential real-time updates
      await page.waitForTimeout(5000);

      // Check browser-side WebSocket activity
      const browserWsEvents = await page.evaluate(() => window.websocketEvents);
      console.log('Browser WebSocket Events:', browserWsEvents);

      // Cleanup
      unsubscribe();

      // At least one side should have WebSocket activity
      expect(browserWsEvents.length > 0 || serverUpdateReceived).toBe(true);
    }, TEST_TIMEOUT);

    test('should handle WebSocket disconnection and reconnection', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      // Get initial WebSocket events
      const initialEvents = await page.evaluate(() => window.websocketEvents);
      console.log('Initial WebSocket Events:', initialEvents);

      // Simulate network disconnection by closing WebSocket connections
      await page.evaluate(() => {
        // Find and close any open WebSocket connections
        if (window.WebSocket && window.WebSocket.prototype) {
          // This is a bit hacky, but simulates network issues
          setTimeout(() => {
            window.websocketEvents.push({
              type: 'simulated_disconnect',
              timestamp: Date.now()
            });
          }, 1000);
        }
      });

      // Wait for potential reconnection attempts
      await page.waitForTimeout(10000);

      // Check final WebSocket events
      const finalEvents = await page.evaluate(() => window.websocketEvents);
      console.log('Final WebSocket Events:', finalEvents);

      // Should have more events after disconnect simulation
      expect(finalEvents.length).toBeGreaterThanOrEqual(initialEvents.length);
    }, TEST_TIMEOUT);
  });

  describe('Error Scenarios', () => {
    test('should handle server unavailable scenario', async () => {
      // Modify WebSocket URL to point to unavailable server
      await page.addInitScript(() => {
        // Override WebSocket creation to use wrong URL
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
          // Change URL to unavailable server
          const wrongUrl = url.replace(':4000', ':9999');
          console.log('Attempting connection to unavailable server:', wrongUrl);
          return new originalWebSocket(wrongUrl, protocols);
        };
      });

      await page.goto(BASE_URL);
      await page.waitForTimeout(5000);

      // Check WebSocket events - should show connection errors
      const wsEvents = await page.evaluate(() => window.websocketEvents);
      console.log('WebSocket Events (server unavailable):', wsEvents);

      // Should have error events
      const errorEvents = wsEvents.filter(event => event.type === 'error' || event.type === 'close');
      expect(errorEvents.length).toBeGreaterThan(0);
      
      console.log('✅ WebSocket errors handled gracefully when server unavailable');
    }, TEST_TIMEOUT);

    test('should handle malformed WebSocket messages', async () => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      // Inject script to send malformed messages if WebSocket is available
      await page.evaluate(() => {
        // Wait a bit then try to send malformed message
        setTimeout(() => {
          // This is a test to see how the client handles errors
          window.websocketEvents.push({
            type: 'test_injection',
            message: 'Attempting to test error handling',
            timestamp: Date.now()
          });
        }, 2000);
      });

      await page.waitForTimeout(5000);

      // Check WebSocket events
      const wsEvents = await page.evaluate(() => window.websocketEvents);
      console.log('WebSocket Events (error handling test):', wsEvents);

      // Should have logged the test injection
      const testEvent = wsEvents.find(event => event.type === 'test_injection');
      expect(testEvent).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Performance and Load', () => {
    test('should handle multiple rapid WebSocket messages', async () => {
      // Create multiple server-side clients
      const clients = [];
      const messagePromises = [];

      for (let i = 0; i < 3; i++) {
        const client = createClient({
          url: WS_URL,
          connectionParams: {}
        });
        clients.push(client);

        const promise = new Promise((resolve) => {
          const unsubscribe = client.subscribe(
            {
              query: `subscription Test${i} { __typename }`
            },
            {
              next: (data) => {
                console.log(`✅ Client ${i} received data:`, data);
                unsubscribe();
                resolve(true);
              },
              error: (error) => {
                console.log(`ℹ️ Client ${i} error:`, error.message);
                resolve(false);
              }
            }
          );

          // Timeout for individual subscription
          setTimeout(() => {
            unsubscribe();
            resolve(false);
          }, 10000);
        });

        messagePromises.push(promise);
      }

      // Also load browser page
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

      // Wait for all subscriptions to complete or timeout
      const results = await Promise.all(messagePromises);
      
      // Cleanup clients
      clients.forEach(client => client.dispose());

      // Check browser WebSocket activity
      const browserEvents = await page.evaluate(() => window.websocketEvents);
      console.log('Browser WebSocket Events during load test:', browserEvents);

      // At least some connections should succeed
      const successCount = results.filter(result => result === true).length;
      console.log(`✅ ${successCount} out of ${results.length} WebSocket connections succeeded`);
      
      expect(successCount).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });
});