import { gql } from "graphql-tag";

export const POLL_LIFE_CYCLE_SUBSCRIPTION = gql`
  subscription ($eventId: ID) {
    pollLifeCycle(eventId: $eventId) {
      eventId
      state
      poll {
        id
        title
        pollAnswer
        type
        list
        possibleAnswers {
          id
          content
        }
        minVotes
        maxVotes
        allowAbstain
      }
      pollResultId
    }
  }
`;
