// headless-console-test.js - Captures all console logs during a single-user voting test
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
  logTestEvent('=== Starting headless console log capture test ===');
  cleanLogFiles();
  
  // Define urls and credentials
  const clientUrl = 'http://localhost:5173';
  const eventSlug = 'loadtest-event';
  const organizerUsername = 'loadtest';
  const organizerPassword = 'TestPassword123!';
  const userPassword = 'test123';

  // Launch browser in headless mode
  const browser = await chromium.launch({ headless: true });
  
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
    await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'organizer-login-page.png') });
    
    // Check for specific login elements
    const usernameField = await organizerPage.locator('#organizer-login-username').count();
    
    if (usernameField > 0) {
      logTestEvent('Found organizer login form');
      await organizerPage.fill('#organizer-login-username', organizerUsername);
      await organizerPage.fill('#organizer-login-password', organizerPassword);
      await organizerPage.click('#organizer-login-submit');
    } else {
      logTestEvent('Could not find standard organizer login form, looking for alternatives');
      
      // Take inventory of what's on the page
      const inputs = await organizerPage.locator('input').count();
      const buttons = await organizerPage.locator('button').count();
      logTestEvent(`Found ${inputs} inputs and ${buttons} buttons on page`);
      
      // Try more generic selectors
      const textInputs = await organizerPage.locator('input[type="text"]').count();
      const passwordInputs = await organizerPage.locator('input[type="password"]').count();
      logTestEvent(`Found ${textInputs} text inputs and ${passwordInputs} password inputs`);
      
      if (textInputs > 0 && passwordInputs > 0) {
        await organizerPage.locator('input[type="text"]').first().fill(organizerUsername);
        await organizerPage.locator('input[type="password"]').first().fill(organizerPassword);
        await organizerPage.locator('button[type="submit"]').first().click();
      } else {
        logTestEvent('Could not find suitable login form elements');
        throw new Error('Login form not found');
      }
    }
    
    // Wait for dashboard page
    await organizerPage.waitForSelector('#app', { timeout: 10000 });
    await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'organizer-post-login.png') });
    
    // Check if login was successful
    const currentUrl = organizerPage.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/events') || !currentUrl.includes('/login')) {
      logTestEvent('Organizer login successful');
    } else {
      logTestEvent('Organizer login may have failed');
      throw new Error('Login appears unsuccessful');
    }
    
    // User login
    logTestEvent(`Logging in as testuser1...`);
    await userPage.goto(`${clientUrl}/e/${eventSlug}`);
    await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'user-login-page.png') });
    
    // Wait for user login form
    const userFormVisible = await userPage.waitForSelector('form input', { timeout: 10000 })
      .then(() => true)
      .catch(() => false);
      
    if (userFormVisible) {
      const textInput = await userPage.locator('input[type="text"]').first();
      const passwordInput = await userPage.locator('input[type="password"]').first();
      
      await textInput.fill('testuser1');
      await passwordInput.fill(userPassword);
      await userPage.locator('button[type="submit"]').click();
    } else {
      logTestEvent('Could not find user login form');
      throw new Error('User login form not found');
    }
    
    // Wait for user dashboard
    await userPage.waitForTimeout(5000);
    await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'user-post-login.png') });
    
    // Check if user login was successful
    const userCurrentUrl = userPage.url();
    if (!userCurrentUrl.includes('/login')) {
      logTestEvent('User login successful');
    } else {
      logTestEvent('User login may have failed');
      throw new Error('User login appears unsuccessful');
    }
    
    // Create a poll
    logTestEvent('Creating a poll...');
    
    // Navigate to poll creation
    try {
      await organizerPage.click('a:has-text("Abstimmungen")');
      await organizerPage.waitForTimeout(2000);
      await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'polls-page.png') });
      
      await organizerPage.click('button:has-text("Neue Abstimmung")');
      await organizerPage.waitForTimeout(2000);
      await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'new-poll-page.png') });
    } catch (navError) {
      logTestEvent(`Navigation error: ${navError.message}`);
      
      // Try direct URL
      await organizerPage.goto(`${clientUrl}/organizer/polls/new`);
      await organizerPage.waitForTimeout(2000);
      await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'direct-new-poll.png') });
    }
    
    // Fill poll form
    try {
      await organizerPage.fill('input[name="title"]', 'Multi-Vote Test');
      
      // Try to find description field
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
      await organizerPage.click('button:has-text("Antwortmöglichkeit hinzufügen")');
      
      // Add options
      const optionInputs = await organizerPage.locator('input[name*="options"]').all();
      if (optionInputs.length > 0) {
        await optionInputs[0].fill('Option 1');
        
        await organizerPage.click('button:has-text("Antwortmöglichkeit hinzufügen")');
        const optionInputs2 = await organizerPage.locator('input[name*="options"]').all();
        if (optionInputs2.length > 1) {
          await optionInputs2[1].fill('Option 2');
        }
        
        await organizerPage.click('button:has-text("Antwortmöglichkeit hinzufügen")');
        const optionInputs3 = await organizerPage.locator('input[name*="options"]').all();
        if (optionInputs3.length > 2) {
          await optionInputs3[2].fill('Option 3');
        }
      }
      
      await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'poll-form-filled.png') });
      
      // Submit poll
      await organizerPage.click('button:has-text("Abstimmung erstellen")');
      await organizerPage.waitForTimeout(3000);
      await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'poll-created.png') });
      
      // Start poll
      await organizerPage.click('button:has-text("Abstimmung starten")');
      logTestEvent('Poll started with 25 votes per user');
      await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'poll-started.png') });
    } catch (pollError) {
      logTestEvent(`Poll creation error: ${pollError.message}`);
      throw new Error('Could not create poll');
    }
    
    // Wait for the poll to reach the user
    logTestEvent('Waiting for poll to reach user...');
    await userPage.waitForTimeout(5000);
    await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'user-waiting-for-poll.png') });
    
    // Try to find the modal or reload if necessary
    let modalVisible = await userPage.locator('.modal, .modal-content, .poll-modal').isVisible().catch(() => false);
    
    if (!modalVisible) {
      logTestEvent('Reloading page to find poll modal...');
      await userPage.reload();
      await userPage.waitForTimeout(3000);
      await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'user-after-reload.png') });
      
      modalVisible = await userPage.locator('.modal, .modal-content, .poll-modal').isVisible().catch(() => false);
    }
    
    // Submit votes
    if (modalVisible) {
      logTestEvent('Poll modal found, submitting 25 votes...');
      
      for (let i = 0; i < 25; i++) {
        try {
          // Screenshot for first and last vote
          if (i === 0 || i === 24) {
            await userPage.screenshot({ path: path.join(ensureLogsDirectory(), `vote-${i+1}.png`) });
          }
          
          // Select a random option
          const radioButtons = await userPage.locator('input[type="radio"]').all();
          if (radioButtons.length === 0) {
            logTestEvent(`No radio buttons found for vote ${i+1}`);
            break;
          }
          
          const randomIndex = Math.floor(Math.random() * radioButtons.length);
          await radioButtons[randomIndex].click();
          
          // Submit vote
          await userPage.click('button[type="submit"]');
          logTestEvent(`Vote ${i+1}/25 submitted`);
          
          // Wait for next vote or success
          if (i < 24) {
            await userPage.waitForTimeout(1000);
          }
        } catch (voteError) {
          logTestEvent(`Error during vote ${i+1}: ${voteError.message}`);
        }
      }
      
      // Verify completion
      await userPage.waitForTimeout(3000);
      await userPage.screenshot({ path: path.join(ensureLogsDirectory(), 'voting-completed.png') });
      logTestEvent('All votes submitted');
    } else {
      logTestEvent('No poll modal found');
      throw new Error('Poll modal not found');
    }
    
    // Wait to capture final results and console logs
    logTestEvent('Waiting for final results...');
    await organizerPage.waitForTimeout(15000);
    await organizerPage.screenshot({ path: path.join(ensureLogsDirectory(), 'organizer-final-view.png') });
    
  } catch (error) {
    logTestEvent(`Test error: ${error.message}`);
    console.error('Test error:', error);
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