export function usePollStatePersistence() {
  // Sichere Wrapper-Funktionen für localStorage-Zugriffe
  let persistence = {
    getItem: function(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error(`[Storage] Fehler beim Lesen von ${key}:`, e);
        return null;
      }
    },
    setItem: function(key, value) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.error(`[Storage] Fehler beim Schreiben von ${key}:`, e);
        return false;
      }
    },
    removeItem: function(key) {
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error(`[Storage] Fehler beim Löschen von ${key}:`, e);
        return false;
      }
    },
    key: function(index) {
      try {
        return window.localStorage.key(index);
      } catch (e) {
        console.error(`[Storage] Fehler beim Zugriff auf Index ${index}:`, e);
        return null;
      }
    },
    get length() {
      try {
        return window.localStorage.length;
      } catch (e) {
        console.error(`[Storage] Fehler beim Zugriff auf length:`, e);
        return 0;
      }
    }
  };
  
  // Bei Initialisierung prüfen, ob localStorage verfügbar ist
  let storageAvailable = true;
  try {
    window.localStorage.setItem('test-storage', 'test');
    window.localStorage.removeItem('test-storage');
  } catch (e) {
    console.warn('[Storage] localStorage nicht verfügbar, verwende Memory-Fallback:', e);
    storageAvailable = false;
  }
  
  // Wenn localStorage nicht verfügbar ist, verwende In-Memory-Speicher als Fallback
  if (!storageAvailable) {
    const memoryStorage = {};
    persistence = {
      getItem: function(key) {
        return memoryStorage[key] || null;
      },
      setItem: function(key, value) {
        memoryStorage[key] = value;
        return true;
      },
      removeItem: function(key) {
        delete memoryStorage[key];
        return true;
      },
      key: function(index) {
        return Object.keys(memoryStorage)[index] || null;
      },
      get length() {
        return Object.keys(memoryStorage).length;
      }
    };
  }

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
    // Sicherheitsprüfungen für Parameter
    if (!pollId || !eventUser || !event) {
      console.warn('[Storage] canVote: Ungültige Parameter', { pollId, eventUser, event });
      return true; // Im Zweifelsfall erlauben wir die Abstimmung
    }
    
    // Sichere Extraktion der Event-ID
    const eventId = event.id || (typeof event === 'object' && event.value ? event.value.id : null);
    if (!eventId) {
      console.warn('[Storage] canVote: Keine Event-ID gefunden', { event });
      return true; // Im Zweifelsfall erlauben wir die Abstimmung
    }
    
    // Verwende die Event-ID + Poll-ID als Schlüssel für bessere Isolierung zwischen Abstimmungen
    const stateKey = generateVoteStateKey(pollId, eventId);
    
    // Daten mit sicherer JSON-Parsing-Logik abrufen
    let voteState = { used: 0 };
    try {
      const rawData = persistence.getItem(stateKey);
      if (rawData) {
        voteState = JSON.parse(rawData) || { used: 0 };
      }
    } catch (e) {
      console.error(`[Storage] canVote: Fehler beim Parsen von ${stateKey}:`, e);
      // Bei Fehler trotzdem weitermachen mit Standardwerten
    }
    
    // Sichere Extraktion der voteAmount mit explizitem Fallback auf 1
    const voteAmount = parseInt(eventUser.voteAmount || 1, 10);
    const multivoteType = parseInt(event.multivoteType || 0, 10);
    const usedVotes = parseInt(voteState.used || 0, 10);

    // Logik für die Abstimmungsfähigkeit
    if (
      usedVotes >= voteAmount ||
      (usedVotes > 0 && multivoteType === 2)
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

      // SICHERHEITSPRÜFUNG: Zuvor gespeicherte Werte abrufen, um maximale Stimmenzahl zu validieren
      let previousState = {};
      try {
        const rawState = persistence.getItem(stateKey);
        if (rawState) {
          previousState = JSON.parse(rawState);
        }
      } catch (e) {
        console.error(`[DEBUG:STORAGE] Fehler beim Lesen des vorherigen Zustands:`, e);
      }
      
      // Bei votes=99999 ist besondere Vorsicht geboten
      let computedUsedVotes;
      if (votes === 99999) {
        // Wenn 99999 und expliziter usedVotes-Wert vorhanden, diesen verwenden
        computedUsedVotes = usedVotes !== null ? usedVotes : 0;
      } else {
        // Standardfall: used = votes - 1 oder expliziter Wert
        computedUsedVotes = usedVotes !== null ? usedVotes : votes - 1;
      }
      
      // SICHERHEITSMAßNAHME: Stelle sicher, dass wir niemals mehr als die erlaubten Stimmen zählen
      if (previousState.voteAmount !== undefined && computedUsedVotes > previousState.voteAmount) {
        console.warn(`[DEBUG:STORAGE] Begrenze gespeicherte Stimmen auf maximal erlaubte Anzahl: ${previousState.voteAmount}`);
        computedUsedVotes = previousState.voteAmount;
      }

      const voteState = {
        counter: votes,
        used: computedUsedVotes, // Entweder expliziter Wert oder berechnet
        maxVotesToUse: maxVotesToUse, // Speichere die maximal zu verwendenden Stimmen
        updatedAt: Date.now(),
        voteAmount: previousState.voteAmount // Behalte die maximale Stimmanzahl bei, falls vorhanden
      };

      persistence.setItem(stateKey, JSON.stringify(voteState));

      // Zur Überprüfung: Lese die gespeicherten Daten sofort wieder aus
      const rawStored = persistence.getItem(stateKey);
      try {
        const parsedState = JSON.parse(rawStored);
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

      // Suche nach allen Schlüsseln, die zu dieser Poll gehören könnten
      const possibleKeys = [];
      for (let i = 0; i < persistence.length; i++) {
        const key = persistence.key(i);
        if (key && key.includes(`vote-state-`) && key.includes(`-${pollId}`)) {
          possibleKeys.push(key);
        }
      }

      // Wenn wir genau einen Key gefunden haben, extrahieren wir die Event-ID
      if (possibleKeys.length === 1) {
        const keyParts = possibleKeys[0].split('-');
        if (keyParts.length >= 3) {
          eventId = keyParts[2]; // Format ist vote-state-{eventId}-{pollId}
        }
      }
    }

    // Versuche zuerst mit der neuen Methode (wenn eventId vorhanden)
    if (eventId) {
      const stateKey = generateVoteStateKey(pollId, eventId);
      const rawState = persistence.getItem(stateKey);

      const voteState = JSON.parse(rawState || '{"counter": 1}');

      // KRITISCHE KORREKTUR: Erkenne den speziellen Wert 99999 und behandle ihn korrekt
      // Dieser Wert wird verwendet, um anzuzeigen, dass alle Stimmen verbraucht sind
      if (voteState.counter === 99999) {
        // Bei vollständiger Stimmabgabe den korrekten Wert zurückgeben
        // Wir nutzen den tatsächlichen verwendeten Stimmenwert plus 1
        const usedVotes = voteState.used || 0;
        return usedVotes + 1;
      }

      return voteState.counter || 1;
    }

    // Fallback zur alten Methode
    const votes = persistence.getItem(generateIdentifier(pollId)) || 1;

    const votesInt = parseInt(votes, 10);

    // Auch hier den speziellen Wert 99999 erkennen
    if (votesInt === 99999) {
      return 1; // Fallback, da wir in der alten Methode keinen Zugriff auf used haben
    }

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

      // Wenn wir genau einen Key gefunden haben, extrahieren wir die Event-ID
      if (possibleKeys.length === 1) {
        const keyParts = possibleKeys[0].split('-');
        if (keyParts.length >= 3) {
          eventId = keyParts[2]; // Format ist vote-state-{eventId}-{pollId}
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
          }
        } else {
          console.warn(`[DEBUG:STORAGE] getUsedVotes: Kein neuester Schlüssel gefunden`);
          return 0;
        }
      }
    }

    const stateKey = generateVoteStateKey(pollId, eventId);
    const rawState = persistence.getItem(stateKey);

    const voteState = JSON.parse(rawState || '{"used": 0}');

    const usedVotes = voteState.used || 0;
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
