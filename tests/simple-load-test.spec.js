// simple-load-test.spec.js
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Import modules
const { CONFIG } = require('./config');
const {
  sleep,
  cleanupResultsDirectory,
  writeResults,
  getTestUserId,
  getDisplayName,
  ensureScreenshotsDirectory
} = require('./utils');
const { loginAsOrganizer, createAndStartPoll } = require('./loginOrganizer');
const { loginAsUser } = require('./loginUser');
const { executeVotingInBatches } = require('./votingFunctions');

// Custom configuration for our simplified test
const SIMPLE_CONFIG = {
  ...CONFIG,
  MAX_USERS_PER_TEST: 2,        // Only 2 users (previously 150)
  USERS_PER_BATCH: 2,           // Only 2 users per batch (previously 50)
  VOTE_BATCH_SIZE: 2,           // Process all 2 votes at once (previously 25)
  CONSOLE_LOG_CAPTURE: true,    // Enable console log capture
  WAIT_TIME_FOR_ORGANIZER: 5000,  // Shorter wait time for organizer file check
  MAX_RETRIES_FOR_ORGANIZER_FILE: 10, // Number of retries to find organizer file
};

// Helper function to ensure the results directory exists
function ensureResultsDirectory() {
  const resultsDir = path.join(process.cwd(), CONFIG.RESULTS_DIR);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  return resultsDir;
}

// Helper function to ensure file writes succeed
function writeResultsSafely(filename, data) {
  try {
    const resultsDir = ensureResultsDirectory();
    const filePath = path.join(resultsDir, `${filename}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote data to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Failed to write results to ${filename}.json:`, error);
    return false;
  }
}

// Helper function to check if a file exists and retry if needed
async function checkFileExistsWithRetry(filePath, maxRetries = 5, retryDelay = 1000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      if (fs.existsSync(filePath)) {
        return true;
      }
    } catch (error) {
      console.error(`Error checking if file exists (${filePath}):`, error);
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    retries++;
    console.log(`Retrying file check (${retries}/${maxRetries}): ${filePath}`);
  }
  return false;
}

// Main test function for simple load testing
test.describe('Simple load testing with 2 users + organizer', () => {
  // Before tests: Clear old result files
  test.beforeAll(async () => {
    console.log('=== TEST SETUP: Clearing all old result files ===');
    cleanupResultsDirectory();
    ensureResultsDirectory(); // Make sure results directory exists
    console.log('=== TEST SETUP COMPLETED ===');
  });

  // Organizer login and poll creation
  test('Organizer logs in and creates poll', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture console logs
    if (SIMPLE_CONFIG.CONSOLE_LOG_CAPTURE) {
      page.on('console', msg => {
        console.log(`[ORGANIZER CONSOLE] ${msg.type()}: ${msg.text()}`);
      });
    }

    try {
      console.log("Organizer Test: Attempting to login as organizer...");
      const loginSuccess = await loginAsOrganizer(page);
      expect(loginSuccess).toBeTruthy();

      // Organizer is logged in, but waits for user logins
      console.log("Organizer Test: Login successful. Waiting for users to log in...");

      // Mark that the organizer is ready - with enhanced file writing
      writeResultsSafely('organizer-ready', {
        organizerReady: true,
        timestamp: new Date().toISOString()
      });

      // Wait for users to log in (shorter wait time since we only have 2 users)
      console.log("Organizer Test: Waiting 15 seconds for users to log in...");
      await page.waitForTimeout(15000);

      // Check if user batch files have been created
      console.log("Organizer Test: Checking for current batch files...");
      const resultsDir = path.join(process.cwd(), CONFIG.RESULTS_DIR);

      // Check which files exist (for information only)
      console.log("Organizer Test: Existing files:", fs.readdirSync(resultsDir).join(", "));

      let readyBatches = 0;
      let totalBatches = 0;
      let totalUsersLoggedIn = 0;
      // We expect exactly 2 users
      let targetUserCount = SIMPLE_CONFIG.MAX_USERS_PER_TEST;

      // Function to check user readiness
      async function checkUserBatchesReady() {
        readyBatches = 0;
        totalBatches = 0;
        totalUsersLoggedIn = 0;

        try {
          const files = fs.readdirSync(resultsDir);
          for (const file of files) {
            if (file.startsWith('user-batch-') && file.endsWith('-ready.json')) {
              totalBatches++;

              // Read the file to determine how many users are logged in
              try {
                const batchData = JSON.parse(fs.readFileSync(path.join(resultsDir, file)));
                if (batchData && batchData.usersLoggedIn) {
                  // Check if the batch is marked as complete
                  const usersInThisBatch = batchData.usersLoggedIn || 0;
                  const isBatchComplete = batchData.batchComplete === true;

                  totalUsersLoggedIn += usersInThisBatch;
                  console.log(`Organizer Test: User batch ${file} is ready with ${usersInThisBatch} logged-in users (${isBatchComplete ? 'complete' : 'incomplete'}).`);

                  // Only mark complete batches as "ready"
                  if (isBatchComplete) {
                    readyBatches++;
                  }
                }
              } catch (readError) {
                console.error(`Organizer Test: Error reading ${file}:`, readError);
              }
            }
          }
        } catch (e) {
          console.error("Organizer Test: Error checking user readiness:", e);
        }

        const readyPercentage = totalUsersLoggedIn / targetUserCount * 100;
        console.log(`Organizer Test: ${totalUsersLoggedIn} of ${targetUserCount} users are logged in (${readyPercentage.toFixed(1)}%)`);

        // Only report ready if all expected users are logged in
        // AND all expected batches are marked as complete
        const allUsersReady = totalUsersLoggedIn >= targetUserCount;
        const allBatchesComplete = readyBatches === totalBatches && totalBatches > 0;

        console.log(`Organizer Test: Status - All users ready: ${allUsersReady}, All batches complete: ${allBatchesComplete}, ${readyBatches}/${totalBatches} batches ready`);

        return {
          allReady: allUsersReady && allBatchesComplete && readyPercentage >= CONFIG.USER_READY_PERCENTAGE,
          readyPercentage,
          totalBatches,
          readyBatches,
          totalUsersLoggedIn,
          allBatchesComplete
        };
      }

      // First check
      let readyStatus = await checkUserBatchesReady();

      // Wait for 100% readiness with timeout
      const maxWaitTime = 120000; // 2 minutes max wait time
      const startWaitTime = Date.now();
      const checkInterval = 5000; // check every 5 seconds

      while (!readyStatus.allReady && (Date.now() - startWaitTime) < maxWaitTime) {
        console.log(`Organizer Test: User readiness at ${readyStatus.readyPercentage.toFixed(1)}%, waiting another ${checkInterval / 1000} seconds...`);

        await page.waitForTimeout(checkInterval);
        readyStatus = await checkUserBatchesReady();
      }

      // Create and start the poll
      console.log("Organizer Test: Starting poll creation and activation...");
      const pollStarted = await createAndStartPoll(page);
      expect(pollStarted).toBeTruthy();

      // Verify that the poll is actually active
      console.log("Organizer Test: Verifying that the poll is active...");
      const isActivePollVisible = await page.locator('.active-poll, .poll-active, [data-poll-status="active"]').isVisible().catch(() => false);

      // Save in the file system that the poll has been started - with enhanced file writing
      console.log("Organizer Test: Marking the poll as started and saving result...");
      writeResultsSafely('organizer', {
        pollStarted: true,
        timestamp: new Date().toISOString(),
        pollVisible: isActivePollVisible
      });

      // Stay online for the duration of the test
      console.log("Organizer Test: Staying online for the duration of the test...");
      await page.waitForTimeout(30000); // Reduced to 30 seconds
    } catch (error) {
      console.error("Organizer Test: Error in organizer test:", error.message);
      throw error; // Re-throw to fail the test
    } finally {
      await context.close();
    }
  });

  // Test for user logins and voting
  test('Two users log in and vote in poll', async ({ browser }) => {
    const userContexts = [];
    const userPages = [];
    const votingTimings = [];

    try {
      // Add a small delay before starting user logins
      await new Promise(r => setTimeout(r, 3000));

      console.log(`[User Test] Starting logins for 2 users...`);

      // Set up both users with sequential logins
      for (let userIndex = 0; userIndex < SIMPLE_CONFIG.MAX_USERS_PER_TEST; userIndex++) {
        // Get user credentials - using simplified ID system
        const username = getTestUserId(1, userIndex + 1);
        const displayName = getDisplayName(1, userIndex + 1);
        
        console.log(`[User Test] Preparing login for: ${username} (${displayName})`);
        
        // Space out the logins slightly
        await sleep(500);
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Capture console logs if enabled
        if (SIMPLE_CONFIG.CONSOLE_LOG_CAPTURE) {
          page.on('console', msg => {
            console.log(`[USER ${userIndex + 1} CONSOLE] ${msg.type()}: ${msg.text()}`);
          });
        }
        
        userContexts.push(context);
        userPages.push({
          page,
          userIndex: userIndex + 1,
          username
        });
        
        const loginSuccess = await loginAsUser(page, username, CONFIG.USER_PASSWORD, displayName);
        
        if (!loginSuccess) {
          console.error(`[User Test] Failed to log in user ${userIndex + 1}`);
        }
      }
      
      // Count successful logins
      const successfulLogins = userPages.length;
      console.log(`[User Test] ${successfulLogins} of ${SIMPLE_CONFIG.MAX_USERS_PER_TEST} users successfully logged in`);
      
      // Mark users as ready - with enhanced file writing
      writeResultsSafely(`user-batch-1-ready`, {
        batchId: 1,
        usersLoggedIn: successfulLogins, 
        timestamp: new Date().toISOString(),
        batchComplete: successfulLogins >= SIMPLE_CONFIG.MAX_USERS_PER_TEST
      });
      
      // Check if the organizer is already ready
      const resultsDir = path.join(process.cwd(), CONFIG.RESULTS_DIR);
      const organizerReadyFile = path.join(resultsDir, 'organizer-ready.json');
      
      let organizerReady = false;
      try {
        if (fs.existsSync(organizerReadyFile)) {
          organizerReady = true;
          console.log(`[User Test] Organizer is already ready.`);
        }
      } catch (e) {
        console.error(`[User Test] Error checking organizer status:`, e);
      }

      if (!organizerReady) {
        console.log(`[User Test] Waiting for organizer readiness...`);
        // Actively wait for organizer to be ready
        const organizerReadyExists = await checkFileExistsWithRetry(
          organizerReadyFile, 
          SIMPLE_CONFIG.MAX_RETRIES_FOR_ORGANIZER_FILE, 
          SIMPLE_CONFIG.WAIT_TIME_FOR_ORGANIZER
        );
        
        if (organizerReadyExists) {
          console.log(`[User Test] Organizer is now ready after waiting.`);
        } else {
          console.warn(`[User Test] WARNING: Organizer still not ready after waiting. Continuing anyway...`);
        }
      }

      // Wait for the poll to start
      console.log(`[User Test] Waiting for poll to start...`);
      
      // Wait longer to ensure the poll has really reached everyone
      console.log(`[User Test] Waiting 10 seconds for poll synchronization...`);
      await new Promise(r => setTimeout(r, 10000));
      
      // Check the organizer's result file to see if the poll has been started
      const organizerResultFile = path.join(resultsDir, 'organizer.json');
      let pollStarted = false;
      
      try {
        // Retry checking for the organizer result file
        const organizerFileExists = await checkFileExistsWithRetry(
          organizerResultFile,
          SIMPLE_CONFIG.MAX_RETRIES_FOR_ORGANIZER_FILE,
          SIMPLE_CONFIG.WAIT_TIME_FOR_ORGANIZER
        );
        
        if (organizerFileExists) {
          const organizerData = JSON.parse(fs.readFileSync(organizerResultFile));
          if (organizerData.pollStarted) {
            pollStarted = true;
            console.log(`[User Test] According to organizer data, the poll was started at:`, organizerData.timestamp);
            console.log(`[User Test] Poll visible for organizer:`, organizerData.pollVisible ? 'Yes' : 'No');
          } else {
            console.warn(`[User Test] WARNING: Organizer has not yet started a poll according to file!`);
          }
        } else {
          console.warn(`[User Test] WARNING: No organizer result file found after retries!`);
        }
      } catch (e) {
        console.error(`[User Test] Error reading organizer results:`, e);
      }
      
      // Even if file wasn't found, continue with voting - poll might be active anyway
      console.log(`[User Test] Proceeding with voting process...`);
      
      // Execute voting - all users vote at once since we only have 2
      console.log(`[User Test] Starting voting process with all users at once...`);
      
      // Use the batch function but with all users in one batch
      const successfulVotes = await executeVotingInBatches(userPages, votingTimings);
      
      console.log(`[User Test] ${successfulVotes} of ${userPages.length} votes successful`);
      
      // Check if voting timing data makes sense
      if (votingTimings.length > 0) {
        console.log(`[User Test] Voting times:`,
          votingTimings.map(t => `User ${t.user}: ${t.votingTime}ms`).join(', '));
          
        // Check if any vote has a duration > 0 (indicator of a real vote)
        const realVotes = votingTimings.filter(t => t.votingTime > 0);
        if (realVotes.length === 0 && votingTimings.length > 0) {
          console.warn(`[User Test] WARNING: All successful votes have duration 0ms - possibly no real votes were cast!`);
        }
      }
      
      // Save results for this test - with enhanced file writing
      writeResultsSafely(`user-batch-1`, {
        totalUsers: userPages.length,
        successfulVotes,
        votingTimings,
        batches: 1
      });
      
      // Final verification - stay on the page for a moment to see results
      console.log(`[User Test] Test completed. Waiting 5 seconds to view final state...`);
      await new Promise(r => setTimeout(r, 5000));
      
      // Test is successful if at least one successful vote was cast
      expect(successfulVotes).toBeGreaterThan(0, `User Test: Voting failed - no votes could be cast`);
      
    } finally {
      // Cleanup
      for (const context of userContexts) {
        await context.close();
      }
    }
  });
});