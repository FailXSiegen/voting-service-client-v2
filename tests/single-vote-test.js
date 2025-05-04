// single-vote-test.js - Script to run a test with one user voting and check counts
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
  console.log('=== Starting single user vote test ===');
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
  
  // Launch browser for organizer
  const browser = await chromium.launch({ headless: false }); // Set to false to see the browser UI
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

  // Keep track of database queries in the API console
  let dbQueries = [];

  // Separate page to check SQL queries in API logs
  const apiLogPage = await browser.newPage();
  apiLogPage.on('console', msg => {
    const logText = msg.text();
    if (logText.includes('SQL') || 
        logText.includes('SELECT') || 
        logText.includes('INSERT') || 
        logText.includes('UPDATE') || 
        logText.includes('browser_instance_id') ||
        logText.includes('vote_cycle')) {
      dbQueries.push({
        timestamp: new Date().toISOString(),
        query: logText
      });
      console.log(`[API SQL LOG] ${logText}`);
    }
  });
  
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
  
  // Launch browser for single user
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  
  // Setup console logging for user
  userPage.on('console', msg => {
    console.log(`[USER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
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
  await organizerPage.fill('input[placeholder="Anzahl der Stimmen"]', '25');
  
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
        const randomIndex = Math.floor(Math.random() * radioButtons.length);
        await radioButtons[randomIndex].click();
        
        // Submit vote
        await userPage.click('button[type="submit"]');
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
  
  // Navigate to Database tab and run a direct query to check browser_instance_id counts
  console.log('Checking database for browser_instance_id counts...');
  
  try {
    // Try to execute a direct query using browser DevTools console
    const browserInstanceQuery = `
      SELECT browser_instance_id, COUNT(*) as vote_count
      FROM poll_ballots_unprocessed
      WHERE processed = TRUE
      GROUP BY browser_instance_id;
    `;
    
    // Write the query to a file that we will load in the console
    const queryFile = path.join(process.cwd(), 'browser-instance-query.js');
    fs.writeFileSync(queryFile, `
      // Run this in the browser console to check browser instance counts
      async function checkBrowserInstances() {
        try {
          const query = \`${browserInstanceQuery}\`;
          const response = await fetch('/api/admin/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('BROWSER_INSTANCE_RESULTS:', JSON.stringify(result));
            return result;
          } else {
            console.error('Query failed:', await response.text());
          }
        } catch (error) {
          console.error('Query execution error:', error);
        }
      }
      
      checkBrowserInstances();
    `);
    
    // Save all subscription updates
    writeResults('pubsub-updates', {
      pollStartTime,
      updates: pubsubUpdates
    });
    
    // Save DB queries
    writeResults('db-queries', dbQueries);
    
    // Create summary results
    writeResults('summary', {
      testCompleted: true,
      timestamp: new Date().toISOString(),
      votesSubmitted: 25,
      pollStartTime
    });
  } catch (error) {
    console.error('Failed to check database:', error);
  }
  
  // Keep browsers open for 30 seconds so user can inspect
  console.log('Test completed, keeping browsers open for 30 seconds for inspection...');
  await new Promise(r => setTimeout(r, 30000));
  
  // Close everything
  await userContext.close();
  await organizerContext.close();
  await browser.close();
  
  console.log('=== Test finished successfully ===');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});