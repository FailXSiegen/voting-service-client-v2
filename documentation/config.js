/**
 * Configuration file for the documentation process
 */
module.exports = {
  // Playwright test configuration
  baseUrl: 'http://localhost:5173', // Update to match your application URL
  
  // Organizer test account credentials from loadtest
  credentials: {
    email: 'loadtest@example.org',
    password: 'TestPassword123!',
  },
  
  // Test event ID - using event ID 978 as specified
  eventId: '978',
  
  // Output directory for screenshots
  outputDir: 'screenshots'
};