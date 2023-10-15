import { gql } from "graphql-tag";

export const UPDATE_POLL = gql`
  mutation updatePoll($input: UpdatePollInput!, $instantStart: Boolean!) {
    updatePoll(input: $input, instantStart: $instantStart) {
      id
      eventId
      title
      pollAnswer
      list
      type
      possibleAnswers {
        content
      }
    }
  }
`;
