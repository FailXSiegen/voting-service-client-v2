import { gql } from "graphql-tag";

export const POLLS = gql`
  query polls($eventId: ID) {
    polls(eventId: $eventId) {
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
