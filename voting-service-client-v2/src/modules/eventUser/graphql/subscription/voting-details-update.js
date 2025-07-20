import { gql } from "@apollo/client/core";

/**
 * Subscription für Voting-Details Updates
 * WICHTIG: Poll-Objekt entfernt, um Probleme mit fehlenden type-Eigenschaften zu vermeiden
 * Stattdessen verwenden wir das bereits vorhandene Poll-Objekt vom Client
 */
export const VOTING_DETAILS_UPDATE_SUBSCRIPTION = gql`
  subscription VotingDetailsUpdate($eventId: ID!) {
    votingDetailsUpdate(eventId: $eventId) {
      state
      pollAnswers {
        pollUserId
        answerContent
      }
      pollUser {
        eventUserId
        publicName
      }
      pollUserVoted {
        eventUserId
      }
    }
  }
`;