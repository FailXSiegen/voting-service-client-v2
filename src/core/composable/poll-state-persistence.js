export function usePollStatePersistence() {
  const persistence = window.localStorage;

  function generateIdentifier(pollId) {
    return `poll-persistence-${pollId}`;
  }

  /**
   * Generiert eine eindeutige Kennung für den Vote-State unter Berücksichtigung der Event-ID
   * Dies stellt sicher, dass Vote-States nicht über Events hinweg übertragen werden
   * @param {number} pollId 
   * @param {number} eventId
   * @returns {string}
   */
  function generateVoteStateKey(pollId, eventId) {
    return `vote-state-${eventId}-${pollId}`;
  }

  /**
   * @param {number} pollId
   * @returns {boolean}
   */
  function canVote(pollId, eventUser, event) {
    // Verwende die Event-ID + Poll-ID als Schlüssel für bessere Isolierung zwischen Abstimmungen
    const stateKey = generateVoteStateKey(pollId, event.id);
    const voteState = JSON.parse(persistence.getItem(stateKey) || '{"used": 0}');
    const usedVotes = voteState.used || 0;
    
    if (
      usedVotes >= (eventUser.voteAmount || 1) ||
      (usedVotes > 0 && event.multivoteType === 2)
    ) {
      return false;
    }

    return true;
  }

  /**
   * @param {number} pollId
   * @param {number} votes
   * @param {number} eventId - Optional event ID für bessere Isolierung (aus dem aktuellen Event)
   */
  /**
   * @param {number} pollId
   * @param {number} votes
   * @param {number} usedVotes - Optional die Anzahl der verwendeten Stimmen
   * @param {number} eventId - Optional event ID für bessere Isolierung
   * @param {number} maxVotesToUse - Optional maximale Stimmen für diese Session
   */
  function upsertPollState(pollId, votes, usedVotes = null, eventId = null, maxVotesToUse = null) {
    // Legacy-Unterstützung für ältere Implementierung
    persistence.setItem(generateIdentifier(pollId), votes);
    
    // Neue Implementierung mit besserer Isolierung zwischen Abstimmungen und Events
    if (eventId) {
      const stateKey = generateVoteStateKey(pollId, eventId);
      const voteState = {
        counter: votes,
        used: usedVotes !== null ? usedVotes : votes - 1, // Bei Standard-Zähler ist used = counter - 1
        maxVotesToUse: maxVotesToUse, // Speichere die maximal zu verwendenden Stimmen
        updatedAt: Date.now()
      };
      persistence.setItem(stateKey, JSON.stringify(voteState));
    }
  }

  /**
   * @param {number} pollId
   * @param {number} eventId - Optional event ID für bessere Isolierung
   * @return {number}
   */
  function restoreVoteCounter(pollId, eventId = null) {
    // Versuche zuerst mit der neuen Methode (wenn eventId vorhanden)
    if (eventId) {
      const stateKey = generateVoteStateKey(pollId, eventId);
      const voteState = JSON.parse(persistence.getItem(stateKey) || '{"counter": 1}');
      return voteState.counter || 1;
    }
    
    // Fallback zur alten Methode
    const votes = persistence.getItem(generateIdentifier(pollId)) || 1;
    return parseInt(votes, 10);
  }
  
  /**
   * Gibt die maximal zu verwendenden Stimmen für einen Poll zurück
   * @param {number} pollId 
   * @param {number} eventId
   * @param {number} defaultValue - Standardwert, wenn keine maxVotesToUse gesetzt sind
   * @returns {number|null}
   */
  function getMaxVotesToUse(pollId, eventId, defaultValue = null) {
    if (!eventId || !pollId) return defaultValue;
    
    const stateKey = generateVoteStateKey(pollId, eventId);
    const voteState = JSON.parse(persistence.getItem(stateKey) || '{}');
    return voteState.maxVotesToUse !== undefined ? voteState.maxVotesToUse : defaultValue;
  }
  
  /**
   * Speichert die maximal zu verwendenden Stimmen für einen Poll
   * @param {number} pollId 
   * @param {number} eventId
   * @param {number} maxVotesToUse
   */
  function setMaxVotesToUse(pollId, eventId, maxVotesToUse) {
    if (!eventId || !pollId) return;
    
    const stateKey = generateVoteStateKey(pollId, eventId);
    const existingState = JSON.parse(persistence.getItem(stateKey) || '{}');
    const voteState = {
      ...existingState,
      maxVotesToUse: maxVotesToUse,
      updatedAt: Date.now()
    };
    persistence.setItem(stateKey, JSON.stringify(voteState));
  }
  
  /**
   * Gibt die Anzahl der bisher verwendeten Stimmen für einen Poll zurück
   * @param {number} pollId 
   * @param {number} eventId
   * @returns {number}
   */
  function getUsedVotes(pollId, eventId) {
    if (!eventId || !pollId) return 0;
    
    const stateKey = generateVoteStateKey(pollId, eventId);
    const voteState = JSON.parse(persistence.getItem(stateKey) || '{"used": 0}');
    return voteState.used || 0;
  }
  
  /**
   * Setzt den Vote-State für einen neuen Poll komplett zurück
   * @param {number} pollId 
   * @param {number} eventId
   */
  function resetVoteState(pollId, eventId) {
    if (!eventId || !pollId) return;
    
    const stateKey = generateVoteStateKey(pollId, eventId);
    const voteState = {
      counter: 1,
      used: 0,
      maxVotesToUse: null, // Auch die gespeicherte maximale Stimmanzahl zurücksetzen
      updatedAt: Date.now()
    };
    persistence.setItem(stateKey, JSON.stringify(voteState));
  }
  
  /**
   * Setzt den Vote-State für einen Poll zurück, behält aber die maximale Stimmanzahl bei
   * @param {number} pollId 
   * @param {number} eventId
   * @param {number|null} existingMaxVotes Die zu behaltende maximale Stimmanzahl
   */
  function resetVoteStateButKeepMaxVotes(pollId, eventId, existingMaxVotes = null) {
    if (!eventId || !pollId) return;
    
    const stateKey = generateVoteStateKey(pollId, eventId);
    const voteState = {
      counter: 1,
      used: 0,
      maxVotesToUse: existingMaxVotes, // Behalte die gespeicherte maximale Stimmanzahl
      updatedAt: Date.now()
    };
    persistence.setItem(stateKey, JSON.stringify(voteState));
  }

  return {
    canVote,
    upsertPollState,
    restoreVoteCounter,
    getUsedVotes,
    resetVoteState,
    resetVoteStateButKeepMaxVotes,  // Neue Funktion zum Export hinzufügen
    getMaxVotesToUse,
    setMaxVotesToUse
  };
}
