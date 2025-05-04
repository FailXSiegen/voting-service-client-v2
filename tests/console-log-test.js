// console-log-test.js - Captures all console logs during a single-user voting test
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Helper function to ensure logs directory
function ensureLogsDirectory() {
  const logsDir = path.join(process.cwd(), 'test-logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

// Write logs to file
function writeLogToFile(filename, log) {
  try {
    const logsDir = ensureLogsDirectory();
    const filePath = path.join(logsDir, filename);
    fs.appendFileSync(filePath, log + '\n');
    return true;
  } catch (error) {
    console.error(`Failed to write log to ${filename}:`, error);
    return false;
  }
}

// Create clean log files
function cleanLogFiles() {
  const logsDir = ensureLogsDirectory();
  const files = ['organizer-console.log', 'user-console.log', 'test-events.log', 'pubsub-events.log'];
  
  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    fs.writeFileSync(filePath, `=== Log file created at ${new Date().toISOString()} ===\n\n`);
    console.log(`Created clean log file: ${filePath}`);
  });
}

// Log test event
function logTestEvent(message) {
  console.log(message);
  writeLogToFile('test-events.log', `[${new Date().toISOString()}] ${message}`);
}

// Main function to run the test
async function runTest() {
  logTestEvent('=== Starting console log capture test ===');
  cleanLogFiles();
  
  // Define urls and credentials
  const clientUrl = 'http://localhost:5173'; // Corrected port based on ss output
  const eventSlug = 'loadtest-event';
  const organizerUsername = 'loadtest';
  const organizerPassword = 'TestPassword123!';
  const userPassword = 'test123';

  // Launch browser with headed mode (visible) to help with debugging
  const browser = await chromium.launch({ headless: false });
  
  // Organizer context and page
  const organizerContext = await browser.newContext();
  const organizerPage = await organizerContext.newPage();
  
  // User context and page
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  
  try {
    // Setup console logging for organizer
    organizerPage.on('console', msg => {
      const logText = `[${msg.type()}] ${msg.text()}`;
      console.log(`[ORGANIZER] ${logText}`);
      writeLogToFile('organizer-console.log', logText);
      
      // Special handling for PubSub messages 
      if (msg.text().includes('POLL ANSWER LIFECYCLE')) {
        writeLogToFile('pubsub-events.log', `[${new Date().toISOString()}] ${msg.text()}`);
      }
    });
    
    // Setup console logging for user
    userPage.on('console', msg => {
      const logText = `[${msg.type()}] ${msg.text()}`;
      console.log(`[USER] ${logText}`);
      writeLogToFile('user-console.log', logText);
    });
    
    // Organizer login
    logTestEvent('Logging in as organizer...');
    await organizerPage.goto(`${clientUrl}/login`);
    
    // Take screenshot of login page for debugging
    await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'organizer-login-page.png') });
    
    await organizerPage.waitForSelector('#organizer-login-username', { timeout: 10000 })
      .catch(async () => {
        logTestEvent('Could not find #organizer-login-username, looking for alternatives');
        
        // Look for any input fields
        const inputsCount = await organizerPage.locator('input').count();
        logTestEvent(`Found ${inputsCount} input fields on page`);
        
        // List all input fields for debugging
        const inputs = await organizerPage.locator('input').evaluateAll(
          elements => elements.map(el => ({
            id: el.id,
            name: el.name,
            type: el.type,
            placeholder: el.placeholder
          }))
        );
        
        logTestEvent(`Input fields details: ${JSON.stringify(inputs)}`);
        
        // Try to identify the username field by common patterns
        const usernameField = await organizerPage.locator('input[type="text"], input[type="email"], input[id*="username"], input[id*="email"], input[name*="username"], input[name*="email"]').first();
        if (usernameField) {
          logTestEvent('Found alternative username field');
          return usernameField;
        }
        
        throw new Error('No suitable login fields found');
      });
    
    // Try to fill in the login form
    try {
      // Try with ID selector first
      await organizerPage.fill('#organizer-login-username', organizerUsername);
      await organizerPage.fill('#organizer-login-password', organizerPassword);
      await organizerPage.click('#organizer-login-submit');
    } catch (loginError) {
      logTestEvent(`Login form fill error: ${loginError.message}`);
      
      // Try with more general selectors
      try {
        await organizerPage.fill('input[type="text"], input[type="email"]', organizerUsername);
        await organizerPage.fill('input[type="password"]', organizerPassword);
        await organizerPage.click('button[type="submit"]');
      } catch (generalLoginError) {
        logTestEvent(`General login form fill error: ${generalLoginError.message}`);
        throw new Error('Could not fill login form');
      }
    }
    
    // Wait for login to complete
    await organizerPage.waitForSelector('h1:has-text("Dashboard"), .dashboard, .app-header', { timeout: 20000 })
      .catch(async (error) => {
        logTestEvent(`Could not find dashboard element: ${error.message}`);
        await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'post-login-page.png') });
        
        // Check if we're on any page that indicates successful login
        const pageUrl = organizerPage.url();
        const pageTitle = await organizerPage.title();
        logTestEvent(`Current page: ${pageUrl}, title: ${pageTitle}`);
        
        if (pageUrl.includes('/dashboard') || pageUrl.includes('/events')) {
          logTestEvent('Appears to be logged in based on URL');
          return; // Continue with the test
        }
        
        throw new Error('Login unsuccessful');
      });
    
    logTestEvent('Organizer login successful');
    
    // User login
    const username = 'testuser1';
    logTestEvent(`Logging in as ${username}...`);
    
    await userPage.goto(`${clientUrl}/e/${eventSlug}`);
    await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'user-login-page.png') });
    
    // Wait for and fill in the login form
    try {
      await userPage.waitForSelector('input[type="text"]', { timeout: 10000 });
      await userPage.fill('input[type="text"]', username);
      await userPage.fill('input[type="password"]', userPassword);
      await userPage.click('button.btn-primary');
    } catch (userLoginError) {
      logTestEvent(`User login form error: ${userLoginError.message}`);
      
      // Try more general selectors
      try {
        const inputs = await userPage.locator('input').all();
        if (inputs.length >= 2) {
          await inputs[0].fill(username);
          await inputs[1].fill(userPassword);
          await userPage.locator('button').first().click();
        } else {
          throw new Error('Not enough input fields found');
        }
      } catch (generalUserLoginError) {
        logTestEvent(`General user login error: ${generalUserLoginError.message}`);
        throw new Error('Could not complete user login');
      }
    }
    
    // Wait for user login to complete
    await userPage.waitForSelector('h2:has-text("Willkommen"), .dashboard, .app-header', { timeout: 20000 })
      .catch(async (error) => {
        logTestEvent(`Could not confirm user login: ${error.message}`);
        await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'user-post-login.png') });
        
        // Check if we're on any page that indicates successful login
        const pageUrl = userPage.url();
        if (!pageUrl.includes('/login')) {
          logTestEvent('User appears to be logged in based on URL');
          return; // Continue with the test
        }
        
        throw new Error('User login unsuccessful');
      });
    
    logTestEvent(`User ${username} login successful`);
    
    // Create and start a poll
    logTestEvent('Creating and starting poll...');
    await organizerPage.waitForTimeout(2000);
    
    // Navigate to poll creation
    try {
      // Try to find the Abstimmungen link
      await organizerPage.click('a:has-text("Abstimmungen"), a:has-text("Polls")');
      
      // Wait for the new poll button
      await organizerPage.waitForSelector('button:has-text("Neue Abstimmung"), button:has-text("New Poll")', { timeout: 10000 });
      await organizerPage.click('button:has-text("Neue Abstimmung"), button:has-text("New Poll")');
    } catch (navError) {
      logTestEvent(`Navigation error: ${navError.message}`);
      await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'organizer-nav-error.png') });
      
      // Try to find any button that might create a poll
      const allButtons = await organizerPage.locator('button').allTextContents();
      logTestEvent(`Available buttons: ${JSON.stringify(allButtons)}`);
      
      // Try a direct URL approach
      await organizerPage.goto(`${clientUrl}/organizer/polls/new`);
    }
    
    // Take screenshot of poll creation page
    await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'poll-creation-page.png') });
    
    // Fill poll details - for a multi-vote poll with 25 votes
    try {
      await organizerPage.waitForSelector('input[name="title"]', { timeout: 10000 });
      await organizerPage.fill('input[name="title"]', 'Multi-Vote Test');
      
      const descriptionField = await organizerPage.locator('textarea[name="description"]');
      if (await descriptionField.count() > 0) {
        await descriptionField.fill('This is a test with 25 votes');
      }
      
      // Set votes per user to 25
      const maxVotesInput = await organizerPage.locator('input[placeholder="Anzahl der Stimmen"], input[name*="maxVotes"]');
      if (await maxVotesInput.count() > 0) {
        await maxVotesInput.fill('25');
        logTestEvent('Set max votes to 25');
      } else {
        logTestEvent('Could not find max votes input, using default value');
      }
      
      // Add options
      await organizerPage.click('button:has-text("Antwortmöglichkeit hinzufügen"), button:has-text("Add option")');
      
      // Find option input fields
      const optionInputs = await organizerPage.locator('input[name*="options"]').all();
      
      if (optionInputs.length > 0) {
        await optionInputs[0].fill('Option 1');
        
        // Add and fill second option
        await organizerPage.click('button:has-text("Antwortmöglichkeit hinzufügen"), button:has-text("Add option")');
        const optionInputs2 = await organizerPage.locator('input[name*="options"]').all();
        if (optionInputs2.length > 1) {
          await optionInputs2[1].fill('Option 2');
        }
        
        // Add and fill third option
        await organizerPage.click('button:has-text("Antwortmöglichkeit hinzufügen"), button:has-text("Add option")');
        const optionInputs3 = await organizerPage.locator('input[name*="options"]').all();
        if (optionInputs3.length > 2) {
          await optionInputs3[2].fill('Option 3');
        }
      } else {
        logTestEvent('Could not find option input fields');
      }
      
      // Take screenshot before submitting the form
      await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'poll-form-filled.png') });
      
      // Submit the poll
      await organizerPage.click('button:has-text("Abstimmung erstellen"), button:has-text("Create Poll")');
      
      // Wait for the start button
      await organizerPage.waitForSelector('button:has-text("Abstimmung starten"), button:has-text("Start Poll")', { timeout: 20000 });
      
      // Start the poll
      await organizerPage.click('button:has-text("Abstimmung starten"), button:has-text("Start Poll")');
      logTestEvent('Poll started with 25 votes per user');
    } catch (pollCreationError) {
      logTestEvent(`Poll creation error: ${pollCreationError.message}`);
      await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'poll-creation-error.png') });
      throw new Error('Could not create or start poll');
    }
    
    // Take screenshot of organizer's view after starting the poll
    await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'poll-started-organizer.png') });
    
    // Wait for the poll modal to appear for user and vote
    logTestEvent('Waiting for poll to reach user...');
    await userPage.waitForTimeout(5000);
    
    // Take a screenshot of user's current view
    await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'user-waiting-for-poll.png') });
    
    // Try to find the modal or reload if necessary
    let modalVisible = await userPage.locator('.modal, .modal-content, .poll-modal').isVisible().catch(() => false);
    
    if (!modalVisible) {
      logTestEvent('Reloading page to find poll modal...');
      await userPage.reload();
      await userPage.waitForTimeout(2000);
      
      await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'user-after-reload.png') });
      modalVisible = await userPage.locator('.modal, .modal-content, .poll-modal').isVisible().catch(() => false);
    }
    
    // Submit all 25 votes one by one
    if (modalVisible) {
      logTestEvent('Poll modal found, submitting 25 votes one by one...');
      
      for (let i = 0; i < 25; i++) {
        try {
          // Take screenshot before each vote
          if (i === 0 || i === 24) { // First and last vote
            await userPage.screenshot({ path: path.join(ensureLogsDirectory(), `vote-${i+1}-before.png`) });
          }
          
          // Select a random option
          const radioButtons = await userPage.locator('input[type="radio"]').all();
          if (radioButtons.length === 0) {
            logTestEvent(`No radio buttons found for vote ${i+1}`);
            await userPage.screenshot({ path: path.join(ensureLogsDirectory(), `no-radio-buttons-vote-${i+1}.png`) });
            break;
          }
          
          const randomIndex = Math.floor(Math.random() * radioButtons.length);
          await radioButtons[randomIndex].click();
          
          // Submit vote
          const submitButton = await userPage.locator('button[type="submit"]').first();
          await submitButton.click();
          logTestEvent(`Vote ${i+1}/25 submitted`);
          
          // Wait for the next vote opportunity or success message
          if (i < 24) {
            // Wait for the next voting opportunity
            await userPage.waitForTimeout(1000);
          } else {
            // Final vote - wait for success message
            const successMessage = await userPage.waitForSelector('.alert-success, .vote-success', { timeout: 10000 })
              .catch(() => null);
              
            if (successMessage) {
              logTestEvent('All 25 votes submitted successfully');
              await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'voting-completed.png') });
            } else {
              logTestEvent('Could not confirm success of final vote');
              await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'final-vote-status.png') });
            }
          }
        } catch (error) {
          logTestEvent(`Error during vote ${i+1}: ${error.message}`);
          await userPage.screenshot({ path: path.join(ensureLogsDirectory(), `vote-${i+1}-error.png`) });
        }
      }
    } else {
      logTestEvent('No poll modal found for user after reload');
      await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'no-poll-modal-found.png') });
    }
    
    // Wait to see final poll results and subscription updates
    logTestEvent('Waiting to see final results...');
    await organizerPage.waitForTimeout(20000);
    
    // Take final screenshot of organizer's view
    await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'organizer-final-view.png') });
    
    // Check the UI for vote counts on organizer page
    const voteCounterText = await organizerPage.locator('.vote-counter, .poll-stats, .poll-progress, .progress-info').allTextContents();
    logTestEvent(`Vote counter on organizer UI: ${JSON.stringify(voteCounterText)}`);
    
    logTestEvent('Test completed successfully');
    
    // Keep the browser open for a while to allow inspection
    logTestEvent('Keeping browser open for 30 seconds for inspection...');
    await new Promise(r => setTimeout(r, 30000));
  } catch (error) {
    logTestEvent(`Test error: ${error.message}`);
    console.error('Test error:', error);
    
    // Take screenshots for debugging
    await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'organizer-error.png') });
    await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'user-error.png') });
  } finally {
    // Close everything
    await userContext.close();
    await organizerContext.close();
    await browser.close();
    
    logTestEvent('=== Test finished ===');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});