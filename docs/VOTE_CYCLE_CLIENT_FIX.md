# Client Vote Cycle Calculation Fix

## Problem Description

We identified an issue where the client code was incorrectly calculating the `voteCycle` value when users had multiple ballots (`vote_amount > 1`). Specifically:

1. The client was incorrectly setting `voteCycle=3` for the second ballot when the user only had `vote_amount=2`
2. This caused confusion on the server side, which correctly rejected setting `vote_cycle=3` in the database
3. The inconsistency led to logs showing "CRITICAL CYCLE UPDATE" messages that did not take effect

## Root Cause

The issue was found in `voting-process.js` where the client calculates the next `voteCounter` value, which is then used as `voteCycle` when submitting votes:

```javascript
// Original problematic code
const maxVotesPerBallot = poll?.maxVotes || 1;
const currentUsedBallots = Math.ceil(usedVotesCount.value / maxVotesPerBallot);
const expectedVoteCounter = currentUsedBallots + 1;
```

This calculation did not account for the user's `voteAmount` limit, causing the counter to exceed the allowed maximum in certain scenarios.

## Solution

We modified the code in four critical locations to ensure the `voteCounter` (and thus the `voteCycle`) never exceeds the user's maximum allowed ballot count and that the correct ballot number is used:

### 1. Main Vote Counter Calculation

```javascript
const maxVotesPerBallot = poll?.maxVotes || 1;
const currentUsedBallots = Math.ceil(usedVotesCount.value / maxVotesPerBallot);
      
// CRITICAL FIX: Ensure voteCounter never exceeds user's voteAmount
const maxVoteAmount = eventUser.value?.voteAmount || 1;
const expectedVoteCounter = Math.min(currentUsedBallots + 1, maxVoteAmount);
```

### 2. Fallback Vote Counter Setting

```javascript
if (voteCounter.value === 1) {
  const currentUsedBallots = Math.ceil(usedVotesCount.value / maxSelectableAnswers);
  // CRITICAL FIX: Ensure voteCounter never exceeds user's voteAmount
  const maxVoteAmount = eventUser.value?.voteAmount || 1;
  voteCounter.value = Math.min(currentUsedBallots + 1, maxVoteAmount);
  console.log(`[voting-process] Fallback: Setting voteCounter to ${voteCounter.value} (${currentUsedBallots} used ballots + 1, max allowed: ${maxVoteAmount})`);
} else {
  // Also verify that existing voteCounter doesn't exceed voteAmount
  const maxVoteAmount = eventUser.value?.voteAmount || 1;
  if (voteCounter.value > maxVoteAmount) {
    const oldValue = voteCounter.value;
    voteCounter.value = maxVoteAmount;
    console.log(`[voting-process] Correcting excessive voteCounter from ${oldValue} to maximum allowed ${maxVoteAmount}`);
  }
}
```

### 3. Direct Vote Counter Setting After Batch Processing

```javascript
// CRITICAL FIX: Ensure voteCounter never exceeds user's voteAmount
const maxVoteAmount = eventUser.value?.voteAmount || 1;
const calculatedCounter = Math.ceil(usedVotesCount.value / (poll.value?.maxVotes || 1)) + voteBatch.length;
voteCounter.value = Math.min(calculatedCounter, maxVoteAmount);
```

### 4. Correct Vote Cycle Calculation in prepareVoteData

The most critical issue was found in `prepareVoteData` where the vote cycle was being calculated incorrectly:

```javascript
// BEFORE: Incorrect calculation using individual vote count
const currentVoteCycle = usedVotesCount.value + voteIndex + 1; // This produces incorrect values like 4

// AFTER: Use voteCounter directly - it already tracks the correct ballot number
const currentVoteCycle = voteCounter.value; // This ensures the correct ballot number is used
```

This change fixes the core issue where the `voteCycle` value was being calculated based on the number of individual votes (`usedVotesCount`) rather than the actual ballot number (`voteCounter`), which caused values like `voteCycle=4` to be sent even when the user only had 2 ballots available.

## Expected Result

With these changes:

1. The client will never send a `voteCycle` value larger than the user's allowed `vote_amount`
2. Ballot counting will remain accurate
3. The server will not need to reject invalid cycle values
4. Log messages will be more informative about capping large cycle values
5. The system will handle large-scale testing (1000+ ballots) correctly by limiting cycle values to the user's `vote_amount`

This fix ensures consistency between client and server expectations about ballot cycles, improving the reliability of multi-ballot voting.