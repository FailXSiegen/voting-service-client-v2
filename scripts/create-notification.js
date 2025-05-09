// Create notification file script
// Run with: node scripts/create-notification.js

const fs = require('fs');
const path = require('path');

// Configuration values from config.js
const CONFIG = {
    MAX_USERS_PER_TEST: 150,
    REDUCED_WAIT_TIME: 10000
};

// Function to force create notification file
function createNotificationFile() {
    try {
        const resultsDir = path.join(process.cwd(), 'voting-results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
            console.log(`Created results directory: ${resultsDir}`);
        }
        
        const notificationFile = path.join(resultsDir, 'all-voted-notification.json');
        
        // Get existing status if available
        let successfulVotes = 0;
        try {
            if (fs.existsSync(path.join(resultsDir, 'global-vote-status.json'))) {
                const globalStatus = JSON.parse(fs.readFileSync(path.join(resultsDir, 'global-vote-status.json'), 'utf8'));
                successfulVotes = globalStatus.successfulVotes || 0;
                console.log(`Found existing vote status: ${successfulVotes} votes`);
            }
        } catch (e) {
            console.log('Could not read global status file, using default values');
        }

        // Write notification file
        const notificationData = {
            allVoted: true,
            successfulVotes: successfulVotes > 0 ? successfulVotes : CONFIG.MAX_USERS_PER_TEST,
            totalParticipants: CONFIG.MAX_USERS_PER_TEST,
            timestamp: new Date().toISOString(),
            reducedWaitTime: CONFIG.REDUCED_WAIT_TIME,
            source: "manual_script",
            note: "Created by utility script"
        };
        
        fs.writeFileSync(notificationFile, JSON.stringify(notificationData, null, 2));
        
        console.log(`SUCCESS: Created all-voted-notification.json at ${notificationFile}`);
        console.log(`Content: ${JSON.stringify(notificationData, null, 2)}`);
        
        // Verify the file exists
        if (fs.existsSync(notificationFile)) {
            console.log(`VERIFIED: Successfully created notification file`);
            return true;
        } else {
            console.error(`ERROR: Failed to create notification file!`);
            return false;
        }
    } catch (error) {
        console.error(`CRITICAL ERROR: Failed to create notification file:`, error);
        return false;
    }
}

// Execute the function
const success = createNotificationFile();
process.exit(success ? 0 : 1);