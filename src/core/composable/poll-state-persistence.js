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
    console.log(`[DEBUG:STORAGE] upsertPollState: pollId=${pollId}, votes=${votes}, usedVotes=${usedVotes}, eventId=${eventId}, maxVotesToUse=${maxVotesToUse}`);
    
    // Stack-Trace ausgeben, um die Aufrufer zu identifizieren
    console.log(`[DEBUG:STORAGE] CALL STACK:`, new Error().stack);
    
    // Legacy-Unterstützung für ältere Implementierung
    persistence.setItem(generateIdentifier(pollId), votes);
    console.log(`[DEBUG:STORAGE] Legacy-Speicher aktualisiert: ${generateIdentifier(pollId)}=${votes}`);
    
    // Neue Implementierung mit besserer Isolierung zwischen Abstimmungen und Events
    if (eventId) {
      const stateKey = generateVoteStateKey(pollId, eventId);
      
      // Bei votes=99999 ist besondere Vorsicht geboten
      let computedUsedVotes;
      if (votes === 99999) {
        // Wenn 99999 und expliziter usedVotes-Wert vorhanden, diesen verwenden
        computedUsedVotes = usedVotes !== null ? usedVotes : 0;
        console.log(`[DEBUG:STORAGE] Spezieller 99999-Wert erkannt. Verwende explicit usedVotes=${computedUsedVotes}`);
      } else {
        // Standardfall: used = votes - 1 oder expliziter Wert
        computedUsedVotes = usedVotes !== null ? usedVotes : votes - 1;
      }
      
      const voteState = {
        counter: votes,
        used: computedUsedVotes, // Entweder expliziter Wert oder berechnet
        maxVotesToUse: maxVotesToUse, // Speichere die maximal zu verwendenden Stimmen
        updatedAt: Date.now()
      };
      
      console.log(`[DEBUG:STORAGE] Speichere Zustand in ${stateKey}:`, voteState);
      persistence.setItem(stateKey, JSON.stringify(voteState));
      
      // Zur Überprüfung: Lese die gespeicherten Daten sofort wieder aus
      const rawStored = persistence.getItem(stateKey);
      console.log(`[DEBUG:STORAGE] Gespeicherter Rohwert: ${rawStored}`);
      try {
        const parsedState = JSON.parse(rawStored);
        console.log(`[DEBUG:STORAGE] Gespeicherter analysierter Wert:`, parsedState);
      } catch (e) {
        console.error(`[DEBUG:STORAGE] Fehler beim Parsen des gespeicherten Werts:`, e);
      }
    }
  }

  /**
   * @param {number} pollId
   * @param {number} eventId - Optional event ID für bessere Isolierung
   * @return {number}
   */
  function restoreVoteCounter(pollId, eventId = null) {
    // WICHTIG: Wenn keine Event-ID vorhanden ist, versuchen wir zuerst, sie aus dem localStorage abzuleiten
    // Dies kann helfen, Inkonsistenzen bei fehlender Event-ID zu vermeiden
    if (!eventId) {
      console.log(`[DEBUG:STORAGE] Keine Event-ID übergeben, versuche sie zu finden...`);
      
      // Suche nach allen Schlüsseln, die zu dieser Poll gehören könnten
      const possibleKeys = [];
      for (let i = 0; i < persistence.length; i++) {
        const key = persistence.key(i);
        if (key && key.includes(`vote-state-`) && key.includes(`-${pollId}`)) {
          possibleKeys.push(key);
        }
      }
      
      console.log(`[DEBUG:STORAGE] Mögliche passende Schlüssel:`, possibleKeys);
      
      // Wenn wir genau einen Key gefunden haben, extrahieren wir die Event-ID
      if (possibleKeys.length === 1) {
        const keyParts = possibleKeys[0].split('-');
        if (keyParts.length >= 3) {
          eventId = keyParts[2]; // Format ist vote-state-{eventId}-{pollId}
          console.log(`[DEBUG:STORAGE] Event-ID aus Schlüssel abgeleitet: ${eventId}`);
        }
      }
    }
    
    // Versuche zuerst mit der neuen Methode (wenn eventId vorhanden)
    if (eventId) {
      const stateKey = generateVoteStateKey(pollId, eventId);
      const rawState = persistence.getItem(stateKey);
      console.log(`[DEBUG:STORAGE] Gespeicherter Vote-State für ${stateKey}: ${rawState}`);
      
      const voteState = JSON.parse(rawState || '{"counter": 1}');
      console.log(`[DEBUG:STORAGE] Parsed Vote-State:`, voteState);
      
      // KRITISCHE KORREKTUR: Erkenne den speziellen Wert 99999 und behandle ihn korrekt
      // Dieser Wert wird verwendet, um anzuzeigen, dass alle Stimmen verbraucht sind
      if (voteState.counter === 99999) {
        // Bei vollständiger Stimmabgabe den korrekten Wert zurückgeben
        // Wir nutzen den tatsächlichen verwendeten Stimmenwert plus 1
        const usedVotes = voteState.used || 0;
        console.log(`[DEBUG:STORAGE] Spezieller Wert 99999 erkannt, used=${usedVotes}, gebe ${usedVotes + 1} zurück`);
        return usedVotes + 1;
      }
      
      console.log(`[DEBUG:STORAGE] Normaler Wert erkannt, gebe ${voteState.counter || 1} zurück`);
      return voteState.counter || 1;
    }
    
    // Fallback zur alten Methode
    const votes = persistence.getItem(generateIdentifier(pollId)) || 1;
    console.log(`[DEBUG:STORAGE] Legacy-Speicher für ${generateIdentifier(pollId)}: ${votes}`);
    
    const votesInt = parseInt(votes, 10);
    
    // Auch hier den speziellen Wert 99999 erkennen
    if (votesInt === 99999) {
      console.log(`[DEBUG:STORAGE] Legacy: Spezieller Wert 99999 erkannt, gebe 1 zurück`);
      return 1; // Fallback, da wir in der alten Methode keinen Zugriff auf used haben
    }
    
    console.log(`[DEBUG:STORAGE] Legacy: Normaler Wert erkannt, gebe ${votesInt} zurück`);
    return votesInt;
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
    // WICHTIG: Wenn keine Event-ID vorhanden ist, versuchen wir zuerst, sie aus dem localStorage abzuleiten
    // Dies ist analog zur Implementierung in restoreVoteCounter
    if (!eventId || !pollId) {
      console.log(`[DEBUG:STORAGE] getUsedVotes: Keine Event-ID übergeben, versuche sie zu finden...`);
      
      if (!pollId) {
        console.warn(`[DEBUG:STORAGE] getUsedVotes: Keine Poll-ID vorhanden, kann keine Stimmen abrufen`);
        return 0;
      }
      
      // Suche nach allen Schlüsseln, die zu dieser Poll gehören könnten
      const possibleKeys = [];
      for (let i = 0; i < persistence.length; i++) {
        const key = persistence.key(i);
        if (key && key.includes(`vote-state-`) && key.includes(`-${pollId}`)) {
          possibleKeys.push(key);
        }
      }
      
      console.log(`[DEBUG:STORAGE] getUsedVotes: Mögliche passende Schlüssel:`, possibleKeys);
      
      // Wenn wir genau einen Key gefunden haben, extrahieren wir die Event-ID
      if (possibleKeys.length === 1) {
        const keyParts = possibleKeys[0].split('-');
        if (keyParts.length >= 3) {
          eventId = keyParts[2]; // Format ist vote-state-{eventId}-{pollId}
          console.log(`[DEBUG:STORAGE] getUsedVotes: Event-ID aus Schlüssel abgeleitet: ${eventId}`);
        }
      } else if (possibleKeys.length === 0) {
        console.warn(`[DEBUG:STORAGE] getUsedVotes: Keine passenden Schlüssel gefunden`);
        return 0;
      } else {
        console.warn(`[DEBUG:STORAGE] getUsedVotes: Mehrere passende Schlüssel (${possibleKeys.length}) gefunden, verwende den neuesten`);
        
        // Bei mehreren Schlüsseln versuchen wir, den neuesten zu finden
        let newestKey = null;
        let newestTimestamp = 0;
        
        for (const key of possibleKeys) {
          try {
            const data = JSON.parse(persistence.getItem(key) || '{}');
            if (data.updatedAt && data.updatedAt > newestTimestamp) {
              newestTimestamp = data.updatedAt;
              newestKey = key;
            }
          } catch (e) {
            console.error(`[DEBUG:STORAGE] getUsedVotes: Fehler beim Parsen von ${key}:`, e);
          }
        }
        
        if (newestKey) {
          const keyParts = newestKey.split('-');
          if (keyParts.length >= 3) {
            eventId = keyParts[2];
            console.log(`[DEBUG:STORAGE] getUsedVotes: Event-ID aus neuestem Schlüssel abgeleitet: ${eventId}`);
          }
        } else {
          console.warn(`[DEBUG:STORAGE] getUsedVotes: Kein neuester Schlüssel gefunden`);
          return 0;
        }
      }
    }
    
    const stateKey = generateVoteStateKey(pollId, eventId);
    const rawState = persistence.getItem(stateKey);
    console.log(`[DEBUG:STORAGE] getUsedVotes für ${stateKey}: Rohdaten=${rawState}`);
    
    const voteState = JSON.parse(rawState || '{"used": 0}');
    console.log(`[DEBUG:STORAGE] getUsedVotes: Analysierte Daten=`, voteState);
    
    const usedVotes = voteState.used || 0;
    console.log(`[DEBUG:STORAGE] getUsedVotes: Gibt ${usedVotes} zurück`);
    return usedVotes;
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
