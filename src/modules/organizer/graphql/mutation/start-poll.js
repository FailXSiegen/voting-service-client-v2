import { gql } from "graphql-tag";

export const START_POLL = gql`
  mutation startPoll($pollId: ID!) {
    startPoll(id: $pollId) {
      id
      eventId
      title
      type
      possibleAnswers {
        content
      }
    }
  }
`;
