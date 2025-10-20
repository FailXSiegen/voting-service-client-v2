import { gql } from '@apollo/client/core';

// Diese Query holt nur die für die Anzeige benötigten Daten
// Sie ist speziell für das VotingDetailsWithSubscription und triggert keine Formular-Updates
export const ACTIVE_POLL_DETAILS_QUERY = gql`
  query ActivePollDetails($eventId: ID!) {
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