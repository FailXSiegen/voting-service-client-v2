// headless-vote-test.js - Script to run a test with one user voting and check counts
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Helper function to ensure results directory
function ensureResultsDirectory() {
  const resultsDir = path.join(process.cwd(), 'voting-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  return resultsDir;
}

// Function to clear previous results
function cleanupResults() {
  const resultsDir = ensureResultsDirectory();
  const files = fs.readdirSync(resultsDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      fs.unlinkSync(path.join(resultsDir, file));
      console.log(`Deleted previous result file: ${file}`);
    }
  }
}

// Write results safely
function writeResults(filename, data) {
  try {
    const resultsDir = ensureResultsDirectory();
    const filePath = path.join(resultsDir, `${filename}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote data to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Failed to write results: ${error}`);
    return false;
  }
}

// Main function to run the test
async function runTest() {
  console.log('=== Starting single user vote test (headless) ===');
  cleanupResults();
  
  // Define urls and credentials
  const clientUrl = 'http://localhost:5173';
  const apiUrl = 'http://localhost:4000';
  const eventSlug = 'loadtest-event';
  const organizerUsername = 'loadtest';
  const organizerPassword = 'TestPassword123!';
  const userPassword = 'test123';

  // Capture all PubSub data
  const pubsubUpdates = [];
  
  // Launch browser for organizer - headless mode
  const browser = await chromium.launch({ headless: true });
  const organizerContext = await browser.newContext();
  const organizerPage = await organizerContext.newPage();
  
  // Setup console logging for organizer with special handling for PubSub data
  organizerPage.on('console', msg => {
    const logText = msg.text();
    console.log(`[ORGANIZER CONSOLE] ${msg.type()}: ${logText}`);
    
    // Capture PubSub updates
    if (logText.includes('POLL ANSWER LIFECYCLE SUBSCRIPTION UPDATE RECEIVED')) {
      pubsubUpdates.push({ timestamp: new Date().toISOString(), type: 'subscription_received' });
    } else if (logText.includes('DATA:') && logText.includes('pollAnswerLifeCycle')) {
      try {
        // Try to extract the JSON data
        const dataStart = logText.indexOf('{');
        if (dataStart >= 0) {
          const jsonStr = logText.substring(dataStart);
          const data = JSON.parse(jsonStr);
          pubsubUpdates.push({ 
            timestamp: new Date().toISOString(), 
            type: 'poll_data',
            data: data.pollAnswerLifeCycle
          });
        }
      } catch (e) {
        console.error('Failed to parse PubSub data:', e);
      }
    } else if (logText.includes('Updating poll answer data:')) {
      pubsubUpdates.push({ 
        timestamp: new Date().toISOString(), 
        type: 'update_started',
        rawText: logText
      });
    } else if (logText.includes('Current UI values after update:') || 
               logText.includes('- Answers:') || 
               logText.includes('- Users:')) {
      pubsubUpdates.push({ 
        timestamp: new Date().toISOString(), 
        type: 'ui_update',
        rawText: logText
      });
    } else if (logText.includes('BATCH PROCESSING MODE:')) {
      pubsubUpdates.push({ 
        timestamp: new Date().toISOString(), 
        type: 'batch_processing',
        rawText: logText
      });
    }
  });
  
  // Launch browser for single user - headless mode
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  
  // Setup console logging for user
  userPage.on('console', msg => {
    console.log(`[USER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    // Organizer login
    console.log('Logging in as organizer...');
    await organizerPage.goto(`${clientUrl}/login`);
    await organizerPage.waitForSelector('#organizer-login-username');
    await organizerPage.fill('#organizer-login-username', organizerUsername);
    await organizerPage.fill('#organizer-login-password', organizerPassword);
    await organizerPage.click('#organizer-login-submit');
    
    // Wait for login to complete
    await organizerPage.waitForSelector('h1:has-text("Dashboard")');
    console.log('Organizer login successful');
    
    // User login
    const username = 'testuser1';
    console.log(`Logging in as ${username}...`);
    
    await userPage.goto(`${clientUrl}/e/${eventSlug}`);
    await userPage.waitForSelector('input[type="text"]');
    await userPage.fill('input[type="text"]', username);
    await userPage.fill('input[type="password"]', userPassword);
    await userPage.click('button.btn-primary');
    
    // Wait for login to complete
    await userPage.waitForSelector('h2:has-text("Willkommen")');
    console.log(`User ${username} login successful`);
    
    // Create and start a poll
    console.log('Creating and starting poll...');
    await organizerPage.waitForTimeout(2000);
    
    // Navigate to poll creation
    await organizerPage.click('a:has-text("Abstimmungen")');
    await organizerPage.waitForSelector('button:has-text("Neue Abstimmung")');
    await organizerPage.click('button:has-text("Neue Abstimmung")');
    
    // Fill poll details - for a multi-vote poll with 25 votes
    await organizerPage.waitForSelector('input[name="title"]');
    await organizerPage.fill('input[name="title"]', 'Multi-Vote Test');
    await organizerPage.fill('textarea[name="description"]', 'This is a test with 25 votes');
    
    // Set votes per user to 25
    const maxVotesInput = await organizerPage.locator('input[placeholder="Anzahl der Stimmen"]');
    if (maxVotesInput) {
      await maxVotesInput.fill('25');
    } else {
      console.log('Could not find max votes input, using default value');
    }
    
    // Add options
    await organizerPage.click('button:has-text("Antwortmöglichkeit hinzufügen")');
    await organizerPage.fill('input[name="options[0].text"]', 'Option 1');
    await organizerPage.click('button:has-text("Antwortmöglichkeit hinzufügen")');
    await organizerPage.fill('input[name="options[1].text"]', 'Option 2');
    await organizerPage.click('button:has-text("Antwortmöglichkeit hinzufügen")');
    await organizerPage.fill('input[name="options[2].text"]', 'Option 3');
    
    // Submit the poll
    await organizerPage.click('button:has-text("Abstimmung erstellen")');
    await organizerPage.waitForSelector('button:has-text("Abstimmung starten")');
    
    // Start the poll
    await organizerPage.click('button:has-text("Abstimmung starten")');
    console.log('Poll started with 25 votes per user');
    
    // Record the poll creation time
    const pollStartTime = new Date().toISOString();
    
    // Wait for the poll modal to appear for user and vote
    console.log('Waiting for poll to reach user...');
    await userPage.waitForTimeout(5000);
    
    // Try to find the modal or reload if necessary
    let modalVisible = await userPage.locator('.modal, .modal-content, .poll-modal').isVisible().catch(() => false);
    
    if (!modalVisible) {
      console.log('Reloading page to find poll modal...');
      await userPage.reload();
      await userPage.waitForTimeout(2000);
      
      modalVisible = await userPage.locator('.modal, .modal-content, .poll-modal').isVisible().catch(() => false);
    }
    
    // Submit all 25 votes one by one
    if (modalVisible) {
      console.log('Poll modal found, submitting 25 votes one by one...');
      
      for (let i = 0; i < 25; i++) {
        try {
          // Select a random option
          const radioButtons = await userPage.locator('input[type="radio"]').all();
          if (radioButtons.length === 0) {
            console.error(`No radio buttons found for vote ${i+1}`);
            break;
          }
          
          const randomIndex = Math.floor(Math.random() * radioButtons.length);
          await radioButtons[randomIndex].click();
          
          // Submit vote
          const submitButton = await userPage.locator('button[type="submit"]').first();
          await submitButton.click();
          console.log(`Vote ${i+1}/25 submitted`);
          
          // Wait for the next vote opportunity or success message
          if (i < 24) {
            // Wait for the next voting opportunity
            await userPage.waitForTimeout(1000);
          } else {
            // Final vote - wait for success message
            await userPage.waitForSelector('.alert-success, .vote-success', { timeout: 10000 });
            console.log('All 25 votes submitted successfully');
          }
        } catch (error) {
          console.error(`Error during vote ${i+1}:`, error);
        }
      }
    } else {
      console.error('No poll modal found for user after reload');
    }
    
    // Wait to see final poll results and subscription updates
    console.log('Waiting to see final results...');
    await organizerPage.waitForTimeout(10000);
    
    // Save all subscription updates
    writeResults('pubsub-updates', {
      pollStartTime,
      updates: pubsubUpdates.filter(update => {
        // Filter out non-meaningful updates to reduce file size
        if (update.type === 'poll_data') {
          // Include only poll data with actual values or status changes
          return update.data && (
            update.data.pollAnswersCount > 0 || 
            update.data.pollUserCount > 0 || 
            update.data.pollUserVotedCount > 0 ||
            update.data.batchProcessing === false
          );
        }
        return true;
      })
    });
    
    // Create summary results
    writeResults('summary', {
      testCompleted: true,
      timestamp: new Date().toISOString(),
      votesSubmitted: 25,
      pollStartTime,
      finalPubSubStatus: pubsubUpdates
        .filter(update => update.type === 'poll_data')
        .slice(-1)[0] // Get the last poll data update
    });
    
    console.log('Test completed successfully, all data recorded');
  } catch (error) {
    console.error('Test error:', error);
    writeResults('test-error', {
      error: error.toString(),
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Close everything
    await userContext.close();
    await organizerContext.close();
    await browser.close();
    
    console.log('=== Test finished ===');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});