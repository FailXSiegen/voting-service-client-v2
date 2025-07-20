import { gql } from "graphql-tag";

export const POLLS_WITH_NO_RESULTS = gql`
  query pollsWithNoResults($eventId: ID) {
    pollsWithNoResults(eventId: $eventId) {
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
  }
`;
