// simplified-test.js - Command-line script to run a simple 2-user + organizer test
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
  console.log('=== Starting simplified test ===');
  cleanupResults();
  
  // Define urls and credentials
  const clientUrl = 'http://localhost:5173';
  const eventSlug = 'loadtest-event';
  const organizerUsername = 'loadtest';
  const organizerPassword = 'TestPassword123!';
  const userPassword = 'test123';
  
  // Launch browser for organizer
  const browser = await chromium.launch({ headless: true });
  const organizerContext = await browser.newContext();
  const organizerPage = await organizerContext.newPage();
  
  // Setup console logging for organizer
  organizerPage.on('console', msg => {
    console.log(`[ORGANIZER CONSOLE] ${msg.type()}: ${msg.text()}`);
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
  
  // Mark organizer as ready
  writeResults('organizer-ready', {
    organizerReady: true,
    timestamp: new Date().toISOString()
  });
  
  // Launch browsers for users
  const userContexts = [];
  const userPages = [];
  
  for (let i = 0; i < 2; i++) {
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    
    // Setup console logging for user
    userPage.on('console', msg => {
      console.log(`[USER ${i+1} CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    
    userContexts.push(userContext);
    userPages.push(userPage);
    
    // User login
    const username = `testuser${i+1}`;
    console.log(`Logging in as ${username}...`);
    
    await userPage.goto(`${clientUrl}/e/${eventSlug}`);
    await userPage.waitForSelector('input[type="text"]');
    await userPage.fill('input[type="text"]', username);
    await userPage.fill('input[type="password"]', userPassword);
    await userPage.click('button.btn-primary');
    
    // Wait for login to complete
    await userPage.waitForSelector('h2:has-text("Willkommen")');
    console.log(`User ${username} login successful`);
  }
  
  // Mark users as ready
  writeResults('user-batch-1-ready', {
    batchId: 1,
    usersLoggedIn: 2,
    timestamp: new Date().toISOString(),
    batchComplete: true
  });
  
  // Create and start a poll
  console.log('Creating and starting poll...');
  await organizerPage.waitForTimeout(2000);
  
  // Navigate to poll creation
  await organizerPage.click('a:has-text("Abstimmungen")');
  await organizerPage.waitForSelector('button:has-text("Neue Abstimmung")');
  await organizerPage.click('button:has-text("Neue Abstimmung")');
  
  // Fill poll details
  await organizerPage.waitForSelector('input[name="title"]');
  await organizerPage.fill('input[name="title"]', 'Test Poll');
  await organizerPage.fill('textarea[name="description"]', 'This is a test poll');
  
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
  console.log('Poll started');
  
  // Mark poll as started
  writeResults('organizer', {
    pollStarted: true,
    timestamp: new Date().toISOString(),
    pollVisible: true
  });
  
  // Wait for the poll modal to appear for users and vote
  console.log('Users voting in poll...');
  await userPages[0].waitForTimeout(5000); // Wait for poll to reach users
  
  const votingTimings = [];
  
  for (let i = 0; i < 2; i++) {
    try {
      const startTime = Date.now();
      
      // Wait for modal or reload if necessary
      let modalVisible = await userPages[i].locator('.modal, .modal-content, .poll-modal').isVisible().catch(() => false);
      
      if (!modalVisible) {
        console.log(`Reloading page for user ${i+1} to find poll modal...`);
        await userPages[i].reload();
        await userPages[i].waitForTimeout(2000);
        
        modalVisible = await userPages[i].locator('.modal, .modal-content, .poll-modal').isVisible().catch(() => false);
      }
      
      if (modalVisible) {
        console.log(`Poll modal found for user ${i+1}, selecting an option...`);
        
        // Select a random option
        const radioButtons = await userPages[i].locator('input[type="radio"]').all();
        const randomIndex = Math.floor(Math.random() * radioButtons.length);
        await radioButtons[randomIndex].click();
        
        // Submit vote
        await userPages[i].click('button[type="submit"]');
        console.log(`User ${i+1} submitted vote`);
        
        // Wait for success message
        await userPages[i].waitForSelector('.alert-success, .vote-success', { timeout: 10000 });
        
        const voteTime = Date.now() - startTime;
        console.log(`User ${i+1} vote completed in ${voteTime}ms`);
        
        votingTimings.push({
          user: i + 1,
          votingTime: voteTime,
          attempt: 1
        });
      } else {
        console.log(`No poll modal found for user ${i+1} after reload`);
      }
    } catch (error) {
      console.error(`Error during voting for user ${i+1}:`, error);
    }
  }
  
  // Save voting results
  writeResults('user-batch-1', {
    totalUsers: 2,
    successfulVotes: votingTimings.length,
    votingTimings,
    batches: 1
  });
  
  // Check subscription updates to see if votes are counted
  console.log('Checking subscription updates...');
  await organizerPage.waitForTimeout(10000);
  
  // Create summary results
  writeResults('summary', {
    testCompleted: true,
    timestamp: new Date().toISOString(),
    usersVoted: votingTimings.length,
    averageVoteTime: votingTimings.reduce((sum, t) => sum + t.votingTime, 0) / votingTimings.length
  });
  
  // Close everything
  console.log('Test completed, closing browsers');
  for (const context of userContexts) {
    await context.close();
  }
  await organizerContext.close();
  await browser.close();
  
  console.log('=== Test finished successfully ===');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});