import { gql } from '@apollo/client/core';

/**
 * Cached Active Poll Details Query
 *
 * Diese Query verwendet den Server-Side Cache für bessere Performance.
 * Anstatt bei jeder Anfrage SQL-Queries auszuführen, wird ein Server-Timer
 * alle 15 Sekunden EINE SQL-Abfrage gemacht und das Ergebnis gecacht.
 */
export const CACHED_ACTIVE_POLL_DETAILS_QUERY = gql`
  query CachedActivePollDetails($eventId: ID!) {
    cachedActivePollEventUser(eventId: $eventId) {
      state
      pollResultId
      pollAnswers {
        id
        pollUserId
        answerContent
      }
      pollUser {
        id
        eventUserId
        publicName
      }
      pollUserVoted {
        id
        eventUserId
      }
      poll {
        id
        title
        type
      }
    }
  }
`;

/**
 * Fallback Query - falls der Cache-Server noch nicht läuft
 */
export const ACTIVE_POLL_DETAILS_FALLBACK_QUERY = gql`
  query ActivePollDetailsFallback($eventId: ID!) {
    activePollEventUser(eventId: $eventId) {
      pollResultId
      pollAnswers {
        id
        pollUserId
        answerContent
      }
      pollUser {
        id
        eventUserId
        publicName
      }
      pollUserVoted {
        id
        eventUserId
      }
      poll {
        id
        title
        type
      }
    }
  }
`;