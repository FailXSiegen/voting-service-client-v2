// voteNotifier.js
const fs = require('fs');
const path = require('path');
const { getResultsDir } = require('./config');

/**
 * Tracks vote completion by writing tracking data to a file
 * This allows tracking vote processing even if the browser session closes
 * 
 * @param {Object} trackingInfo - Information about the votes being processed
 * @param {number} trackingInfo.eventId - The ID of the event
 * @param {number} trackingInfo.pollId - The ID of the poll
 * @param {number} trackingInfo.batchId - The ID of the test batch
 * @param {number} trackingInfo.totalVotes - The total number of votes being submitted
 * @param {number} trackingInfo.userCount - The number of users in this batch
 * @returns {boolean} - Whether the tracking information was successfully written
 */
function trackVoteCompletion(trackingInfo) {
  try {
    const resultsDir = getResultsDir();
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const trackingFile = path.join(resultsDir, `vote-tracking-${trackingInfo.batchId}.json`);
    
    // Add timestamp and pending flag
    const trackingData = {
      ...trackingInfo,
      timestamp: new Date().toISOString(),
      pendingVerification: true
    };
    
    // Write tracking information
    fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
    
    console.log(`[Vote Tracking] Successfully tracked ${trackingInfo.totalVotes} votes for batch ${trackingInfo.batchId}`);
    return true;
  } catch (error) {
    console.error('[Vote Tracking] Error tracking vote completion:', error);
    return false;
  }
}

/**
 * Updates the tracking status of a batch, typically called when votes are verified
 * 
 * @param {number} batchId - The ID of the batch to update
 * @param {Object} updateData - Data to update in the tracking file
 * @returns {boolean} - Whether the update was successful
 */
function updateVoteTracking(batchId, updateData) {
  try {
    const resultsDir = getResultsDir();
    const trackingFile = path.join(resultsDir, `vote-tracking-${batchId}.json`);
    
    if (!fs.existsSync(trackingFile)) {
      console.warn(`[Vote Tracking] Tracking file for batch ${batchId} not found`);
      return false;
    }
    
    // Read existing data
    const existingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
    
    // Merge with new data
    const updatedData = {
      ...existingData,
      ...updateData,
      lastUpdated: new Date().toISOString()
    };
    
    // Write updated data
    fs.writeFileSync(trackingFile, JSON.stringify(updatedData, null, 2));
    
    console.log(`[Vote Tracking] Updated tracking for batch ${batchId}`);
    return true;
  } catch (error) {
    console.error(`[Vote Tracking] Error updating vote tracking for batch ${batchId}:`, error);
    return false;
  }
}

/**
 * Marks a batch as completed, indicating all votes were successfully processed
 * 
 * @param {number} batchId - The ID of the batch to mark as completed 
 * @param {number} successfulVotes - The number of successfully processed votes
 * @returns {boolean} - Whether the operation was successful
 */
function markBatchCompleted(batchId, successfulVotes) {
  return updateVoteTracking(batchId, {
    pendingVerification: false,
    completed: true,
    successfulVotes,
    completedTimestamp: new Date().toISOString()
  });
}

/**
 * Gets the tracking status for all batches
 * 
 * @returns {Array} - Array of tracking data for all batches
 */
function getAllTrackingData() {
  try {
    const resultsDir = getResultsDir();
    const trackingFiles = fs.readdirSync(resultsDir)
      .filter(file => file.startsWith('vote-tracking-') && file.endsWith('.json'));
    
    const trackingData = [];
    
    for (const file of trackingFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
        trackingData.push(data);
      } catch (error) {
        console.error(`[Vote Tracking] Error reading tracking file ${file}:`, error);
      }
    }
    
    return trackingData;
  } catch (error) {
    console.error('[Vote Tracking] Error getting all tracking data:', error);
    return [];
  }
}

/**
 * Checks if all tracked batches are completed
 * 
 * @returns {boolean} - Whether all tracked batches are completed
 */
function areAllBatchesCompleted() {
  const trackingData = getAllTrackingData();
  
  if (trackingData.length === 0) {
    return false;
  }
  
  return trackingData.every(data => data.completed === true);
}

/**
 * Gets the total number of successful votes across all batches
 * 
 * @returns {number} - Total successful votes
 */
function getTotalSuccessfulVotes() {
  const trackingData = getAllTrackingData();
  
  return trackingData.reduce((total, data) => {
    return total + (data.successfulVotes || 0);
  }, 0);
}

module.exports = {
  trackVoteCompletion,
  updateVoteTracking,
  markBatchCompleted,
  getAllTrackingData,
  areAllBatchesCompleted,
  getTotalSuccessfulVotes
};