export function usePollStatePersistence() {
  const persistence = window.localStorage;

  function generateIdentifier(pollId) {
    return `poll-persistence-${pollId}`;
  }

  /**
   * @param {number} pollId
   * @returns {boolean}
   */
  function canVote(pollId, eventUser, event) {
    const votes = persistence.getItem(generateIdentifier(pollId)) || 0;
    if (
      votes >= (eventUser.voteAmount || 1) ||
      (votes > 0 && event.multivoteType === 2)
    ) {
      return false;
    }

    return true;
  }

  /**
   * @param {number} pollId
   * @param {number} votes
   */
  function upsertPollState(pollId, votes) {
    persistence.setItem(generateIdentifier(pollId), votes);
  }

  /**
   * @param {number} pollId
   * @return {number}
   */
  function restoreVoteCounter(pollId) {
    const votes = persistence.getItem(generateIdentifier(pollId)) || 0;

    return parseInt(votes, 10);
  }

  return {
    canVote,
    upsertPollState,
    restoreVoteCounter,
  };
}
